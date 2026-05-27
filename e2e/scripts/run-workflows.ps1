param(
  [switch]$Screenshots,
  [switch]$Recordings,
  [switch]$All,
  [string]$Workflow = ""
)

$ErrorActionPreference = "Stop"
$ROOT_DIR = Resolve-Path "$PSScriptRoot/../.."
$E2E_DIR = Resolve-Path "$PSScriptRoot/.."

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  GardenVerse Workflow Generator" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if (-not $Screenshots -and -not $Recordings -and -not $Workflow) {
  $All = $true
}

Push-Location $E2E_DIR
try {
  if ($All -or $Screenshots) {
    Write-Host "📸 Generating workflow screenshots..." -ForegroundColor Cyan
    npx ts-node workflows/run-all-workflows.ts 2>&1
    if ($LASTEXITCODE -eq 0) {
      Write-Host "✅ Screenshots generated!" -ForegroundColor Green
    } else {
      Write-Host "❌ Screenshots failed" -ForegroundColor Red
    }
  }

  if ($All -or $Recordings) {
    Write-Host "🎥 Recording screen demos..." -ForegroundColor Cyan
    npx ts-node workflows/record-demo.ts 2>&1
    if ($LASTEXITCODE -eq 0) {
      Write-Host "✅ Recordings saved!" -ForegroundColor Green
    } else {
      Write-Host "❌ Recordings failed" -ForegroundColor Red
    }
  }

  if ($Workflow) {
    Write-Host "📸 Capturing workflow: $Workflow..." -ForegroundColor Cyan
    npx playwright test --grep="$Workflow" --config=playwright.config.ts 2>&1
  }

  Write-Host ""
  Write-Host "========================================" -ForegroundColor Cyan
  Write-Host "  Output:" -ForegroundColor Cyan
  Write-Host "  Screenshots: e2e/screenshots/" -ForegroundColor Cyan
  Write-Host "  HTML Pages:  e2e/workflows-data/" -ForegroundColor Cyan
  Write-Host "  Recordings:  playwright-report/recordings/" -ForegroundColor Cyan
  Write-Host "========================================" -ForegroundColor Cyan
} finally {
  Pop-Location
}
