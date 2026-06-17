# GardenVerse Mobile E2E Test Runner
# Runs Detox tests on Android emulator
param(
  [switch]$Build,
  [switch]$NoBuild,
  [string]$TestFilter = "",
  [switch]$Verbose
)

$ErrorActionPreference = "Stop"
$ROOT_DIR = Resolve-Path "$PSScriptRoot/../.."
$MOBILE_DIR = "$ROOT_DIR/packages/mobile"
$E2E_DIR = "$ROOT_DIR/e2e/mobile"
$LOG_DIR = "$ROOT_DIR/e2e/logs"

New-Item -ItemType Directory -Force -Path $LOG_DIR | Out-Null

$timestamp = Get-Date -Format "yyyy-MM-dd-HH-mm-ss"
$logFile = "$LOG_DIR/mobile-e2e-$timestamp.log"

function Write-Log {
  param([string]$Message, [string]$Color = "White")
  $line = "[$(Get-Date -Format 'HH:mm:ss')] $Message"
  Add-Content -Path $logFile -Value $line
  Write-Host $line -ForegroundColor $Color
}

Write-Log "========================================" "Cyan"
Write-Log "  GardenVerse Mobile E2E Test Runner" "Cyan"
Write-Log "  Started: $(Get-Date)" "Cyan"
Write-Log "========================================" "Cyan"

# Check emulator
Write-Log "Checking Android emulator..." "Cyan"
$adb = "C:\Users\lucky\AppData\Local\Android\Sdk\platform-tools\adb.exe"
$devices = & $adb devices 2>&1 | Select-String "emulator"
if (-not $devices) {
  Write-Log "No emulator detected. Starting emulator..." "Yellow"
  $emulator = "C:\Users\lucky\AppData\Local\Android\Sdk\emulator\emulator.exe"
  Start-Process -FilePath $emulator -ArgumentList "-avd", "Pixel_7_API_34", "-no-snapshot-load" -WindowStyle Minimized
  Write-Log "Waiting for emulator to boot..." "Cyan"
  & $adb wait-for-device
  Start-Sleep -Seconds 30
  Write-Log "Emulator ready!" "Green"
} else {
  Write-Log "Emulator detected: $devices" "Green"
}

# Check API
Write-Log "Checking admin API on localhost:3000..." "Cyan"
try {
  $response = Invoke-WebRequest -Uri "http://localhost:3000/api/v1/health" -TimeoutSec 5 -ErrorAction Stop
  Write-Log "API is responding!" "Green"
} catch {
  Write-Log "WARNING: API not responding on localhost:3000" "Yellow"
  Write-Log "Mobile tests may fail without backend API" "Yellow"
}

# Build APK if needed
if ($Build -and -not $NoBuild) {
  Write-Log "Building debug APK..." "Cyan"
  Push-Location $MOBILE_DIR/android
  try {
    cmd /c "gradlew assembleDebug 2>&1" | ForEach-Object { Write-Log $_ }
    Write-Log "APK build complete!" "Green"
  } finally {
    Pop-Location
  }
}

# Run Detox tests
Write-Log "Running Detox E2E tests..." "Cyan"
$loglevel = if ($Verbose) { "verbose" } else { "info" }

Push-Location $ROOT_DIR
try {
  $detoxCmd = "npx detox test --configuration android.emu.debug --loglevel $loglevel --no-color --config detox.config.js"
  if ($TestFilter) {
    $detoxCmd = "$detoxCmd --testNamePattern='$TestFilter'"
  }
  cmd /c "$detoxCmd 2>&1"
  $exitCode = $LASTEXITCODE
} finally {
  Pop-Location
}

if ($exitCode -eq 0) {
  Write-Log "All mobile E2E tests passed!" "Green"
} else {
  Write-Log "Some mobile E2E tests failed (exit code: $exitCode)" "Red"
}

Write-Log "Log: $logFile" "Cyan"
exit $exitCode
