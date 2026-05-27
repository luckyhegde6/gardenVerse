param(
  [switch]$NoDocker,
  [switch]$Headed,
  [switch]$KeepRunning,
  [string]$TestFilter = ""
)

$ErrorActionPreference = "Stop"
$ROOT_DIR = Resolve-Path "$PSScriptRoot/../.."
$E2E_DIR = Resolve-Path "$PSScriptRoot/.."
$BACKEND_DIR = "$ROOT_DIR/packages/backend"
$ADMIN_DIR = "$ROOT_DIR/packages/admin"
$LOG_DIR = "$E2E_DIR/logs"
$REPORT_DIR = "$ROOT_DIR/playwright-report"

New-Item -ItemType Directory -Force -Path $LOG_DIR | Out-Null
New-Item -ItemType Directory -Force -Path $REPORT_DIR | Out-Null

$timestamp = Get-Date -Format "yyyy-MM-dd-HH-mm-ss"
$logFile = "$LOG_DIR/e2e-run-$timestamp.log"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  GardenVerse E2E Test Runner" -ForegroundColor Cyan
Write-Host "  Started: $(Get-Date)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

function Write-Log {
  param([string]$Message, [string]$Color = "White")
  $line = "[$(Get-Date -Format 'HH:mm:ss')] $Message"
  Add-Content -Path $logFile -Value $line
  Write-Host $line -ForegroundColor $Color
}

function Cleanup {
  Write-Log "Cleaning up..." -Color Yellow
  if (-not $KeepRunning) {
    Write-Log "Stopping Docker containers..." -Color Yellow
    docker compose -f "$E2E_DIR/docker/docker-compose.test.yml" down --remove-orphans -v 2>&1 | Out-Null

    Write-Log "Stopping backend process..." -Color Yellow
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -match "backend|nest" } | Stop-Process -Force -ErrorAction SilentlyContinue

    Write-Log "Stopping admin process..." -Color Yellow
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -match "next" } | Stop-Process -Force -ErrorAction SilentlyContinue
  }
  Write-Log "Cleanup complete" -Color Green
}

trap {
  Cleanup
  Write-Log "ERROR: $_" -Color Red
  exit 1
}

# --- Start Infrastructure ---
if (-not $NoDocker) {
  Write-Log "Starting Docker infrastructure (Postgres:5433, Redis:6380)..." -Color Cyan
  $composeDir = "$E2E_DIR/docker"
  $env:COMPOSE_FILE = "$composeDir/docker-compose.test.yml"

  docker compose -f "$composeDir/docker-compose.test.yml" up -d 2>&1 | ForEach-Object { Write-Log $_ }

  Write-Log "Waiting for Postgres to be healthy..." -Color Cyan
  $retries = 30
  $healthy = $false
  while ($retries -gt 0 -and -not $healthy) {
    $status = docker inspect --format='{{.State.Health.Status}}' gardenverse-postgres-test 2>$null
    if ($status -eq "healthy") { $healthy = $true }
    else { Start-Sleep -Seconds 2; $retries-- }
  }
  if (-not $healthy) { throw "Postgres failed to become healthy" }
  Write-Log "Postgres is healthy!" -Color Green

  Write-Log "Waiting for Redis to be healthy..." -Color Cyan
  $retries = 15
  $healthy = $false
  while ($retries -gt 0 -and -not $healthy) {
    $status = docker inspect --format='{{.State.Health.Status}}' gardenverse-redis-test 2>$null
    if ($status -eq "healthy") { $healthy = $true }
    else { Start-Sleep -Seconds 2; $retries-- }
  }
  if (-not $healthy) { throw "Redis failed to become healthy" }
  Write-Log "Redis is healthy!" -Color Green
} else {
  Write-Log "Skipping Docker infrastructure startup" -Color Yellow
}

# --- Database Migrations ---
Write-Log "Running Prisma migrations..." -Color Cyan
Push-Location $BACKEND_DIR
try {
  $env:DATABASE_URL = "postgresql://gardenverse:gardenverse123@localhost:5433/gardenverse_test"
  npx prisma migrate deploy 2>&1 | ForEach-Object { Write-Log $_ }
  npx prisma db seed 2>&1 | ForEach-Object { Write-Log $_ }
  Write-Log "Database migrations complete" -Color Green
} finally {
  Pop-Location
}

# --- Start Backend ---
Write-Log "Starting backend on port 3001..." -Color Cyan
$backendEnv = @{
  "NODE_ENV" = "test"
  "PORT" = "3001"
  "DATABASE_URL" = "postgresql://gardenverse:gardenverse123@localhost:5433/gardenverse_test"
  "REDIS_HOST" = "localhost"
  "REDIS_PORT" = "6380"
  "JWT_SECRET" = "test-jwt-secret-do-not-use-in-prod"
  "JWT_REFRESH_SECRET" = "test-refresh-secret-do-not-use-in-prod"
  "SUPER_ADMIN_REGISTRATION_CODE" = "test-admin-code-123"
  "SWAGGER_ENABLED" = "false"
}

$backendJob = Start-Job -ScriptBlock {
  param($dir, $envVars)
  Set-Location $dir
  foreach ($key in $envVars.Keys) { Set-Item -Path "env:$key" -Value $envVars[$key] }
  npm run start:prod 2>&1
} -ArgumentList $BACKEND_DIR, $backendEnv

Write-Log "Waiting for backend to be ready..." -Color Cyan
Start-Sleep -Seconds 10
$backendRetries = 30
$backendReady = $false
while ($backendRetries -gt 0 -and -not $backendReady) {
  try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/v1/health" -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -eq 200) { $backendReady = $true }
  } catch {}
  if (-not $backendReady) { Start-Sleep -Seconds 2; $backendRetries-- }
}
if (-not $backendReady) { throw "Backend failed to start on port 3001" }
Write-Log "Backend is ready!" -Color Green

# --- Start Admin ---
Write-Log "Starting admin dashboard on port 3000..." -Color Cyan
$adminEnv = @{
  "NODE_ENV" = "test"
  "NEXT_PUBLIC_API_URL" = "http://localhost:3001/api/v1"
  "NEXTAUTH_SECRET" = "test-nextauth-secret"
  "NEXTAUTH_URL" = "http://localhost:3000"
}

$adminJob = Start-Job -ScriptBlock {
  param($dir, $envVars)
  Set-Location $dir
  foreach ($key in $envVars.Keys) { Set-Item -Path "env:$key" -Value $envVars[$key] }
  npm run dev 2>&1
} -ArgumentList $ADMIN_DIR, $adminEnv

Write-Log "Waiting for admin to be ready..." -Color Cyan
Start-Sleep -Seconds 15
$adminRetries = 30
$adminReady = $false
while ($adminRetries -gt 0 -and -not $adminReady) {
  try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 302) { $adminReady = $true }
  } catch {}
  if (-not $adminReady) { Start-Sleep -Seconds 2; $adminRetries-- }
}
if (-not $adminReady) { throw "Admin failed to start on port 3000" }
Write-Log "Admin is ready!" -Color Green

# --- Run Playwright Tests ---
Write-Log "Running Playwright E2E tests..." -Color Cyan
$testArgs = @("playwright", "test", "--config=playwright.config.ts")
if ($Headed) { $testArgs += "--headed" }
if ($TestFilter) { $testArgs += "--grep=$TestFilter" }

$env:BASE_URL = "http://localhost:3000"
$env:API_URL = "http://localhost:3001/api/v1"

Push-Location $E2E_DIR
try {
  $result = npx @testArgs 2>&1
  $result | ForEach-Object { Write-Log $_ }

  $exitCode = $LASTEXITCODE
  if ($exitCode -eq 0) {
    Write-Log "All E2E tests passed!" -Color Green
  } else {
    Write-Log "Some E2E tests failed (exit code: $exitCode)" -Color Red
  }
} finally {
  Pop-Location
}

# --- Run Agentic Feedback ---
Write-Log "Running agentic feedback analysis..." -Color Cyan
Push-Location $E2E_DIR
try {
  npx ts-node scripts/agentic-feedback.ts 2>&1 | ForEach-Object { Write-Log $_ }
  Write-Log "Agentic feedback analysis complete" -Color Green
} finally {
  Pop-Location
}

# --- Cleanup ---
if (-not $KeepRunning) {
  Cleanup
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  E2E Run Complete" -ForegroundColor Cyan
Write-Host "  Log: $logFile" -ForegroundColor Cyan
Write-Host "  Report: $REPORT_DIR" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

exit $exitCode
