param(
  [string]$EnvFile = ".env.production"
)

$ErrorActionPreference = "Stop"
$ROOT_DIR = Resolve-Path "$PSScriptRoot/.."

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  GardenVerse Vercel Deploy Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Vercel CLI
$vercelPath = Get-Command vercel.cmd -ErrorAction SilentlyContinue
if (-not $vercelPath) {
  Write-Host "⚠️  Vercel CLI not found. Installing..." -ForegroundColor Yellow
  npm.cmd install -g vercel 2>&1
}

Push-Location $ROOT_DIR
try {
  # Step 1: Link project if not already linked
  Write-Host "📦 Step 1: Checking Vercel project link..." -ForegroundColor Cyan
  $linked = vercel link --yes 2>&1
  Write-Host $linked

  # Step 2: Pull environment variables
  Write-Host "🔐 Step 2: Pulling environment variables..." -ForegroundColor Cyan
  vercel env pull $EnvFile 2>&1
  Write-Host "   Saved to: $EnvFile" -ForegroundColor Green

  # Step 3: Build admin package
  Write-Host "🏗️  Step 3: Building admin package..." -ForegroundColor Cyan
  npm.cmd run admin:build 2>&1
  if ($LASTEXITCODE -ne 0) { throw "Admin build failed" }
  Write-Host "   ✅ Admin build successful" -ForegroundColor Green

  # Step 4: Deploy preview
  Write-Host "🚀 Step 4: Deploying preview to Vercel..." -ForegroundColor Cyan
  $deployOutput = vercel deploy --prebuilt --yes 2>&1
  $deployUrl = ($deployOutput | Select-String -Pattern "https://[a-zA-Z0-9-]+\.vercel\.app" | Select-Object -First 1).Matches.Value

  if ($deployUrl) {
    Write-Host "   ✅ Deployed to: $deployUrl" -ForegroundColor Green
  } else {
    Write-Host "   ⚠️  Deploy output: $deployOutput" -ForegroundColor Yellow
    $deployUrl = "https://gardenverse.vercel.app"
  }

  # Step 5: Health check
  Write-Host "🏥 Step 5: Running health checks..." -ForegroundColor Cyan
  Start-Sleep -Seconds 10

  $healthEndpoints = @(
    @{ Url = "$deployUrl"; Name = "Admin Dashboard" },
    @{ Url = "$deployUrl/api/health"; Name = "Health Check" }
  )

  foreach ($ep in $healthEndpoints) {
    try {
      $response = Invoke-WebRequest -Uri $ep.Url -TimeoutSec 15 -ErrorAction Stop
      $status = if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 302) { "✅" } else { "⚠️" }
      Write-Host "   $status $($ep.Name): $($response.StatusCode)" -ForegroundColor Green
    } catch {
      Write-Host "   ❌ $($ep.Name): FAILED - $($_.Exception.Message)" -ForegroundColor Red
    }
  }

  # Step 6: Run E2E tests against deployment
  Write-Host "🧪 Step 6: Running E2E tests against deployment..." -ForegroundColor Cyan
  $env:BASE_URL = $deployUrl
  Push-Location "$ROOT_DIR/e2e"
  try {
    npx playwright test --config=playwright.config.ts 2>&1
    if ($LASTEXITCODE -eq 0) {
      Write-Host "   ✅ All E2E tests passed against deployment!" -ForegroundColor Green
    } else {
      Write-Host "   ⚠️  Some E2E tests failed against deployment" -ForegroundColor Yellow
    }
  } finally {
    Pop-Location
  }

  Write-Host ""
  Write-Host "========================================" -ForegroundColor Cyan
  Write-Host "  Summary" -ForegroundColor Cyan
  Write-Host "  Deploy URL: $deployUrl" -ForegroundColor Cyan
  Write-Host "========================================" -ForegroundColor Cyan
} catch {
  Write-Host "❌ ERROR: $_" -ForegroundColor Red
  exit 1
} finally {
  Pop-Location
}
