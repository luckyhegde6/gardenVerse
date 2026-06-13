# GardenVerse Mobile E2E Test Runner with Screenshot Capture
$ErrorActionPreference = "Continue"
$ROOT_DIR = Resolve-Path "$PSScriptRoot/../.."
$MOBILE_DIR = "$ROOT_DIR/packages/mobile"
$E2E_DIR = "$ROOT_DIR/e2e/mobile"
$SCREENSHOT_DIR = "$ROOT_DIR/e2e/screenshots"
$LOG_DIR = "$ROOT_DIR/e2e/logs"

# Create directories
New-Item -ItemType Directory -Force -Path $SCREENSHOT_DIR | Out-Null
New-Item -ItemType Directory -Force -Path $LOG_DIR | Out-Null

$timestamp = Get-Date -Format "yyyy-MM-dd-HH-mm-ss"
$logFile = "$LOG_DIR/e2e-$timestamp.log"

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
    Write-Log "API is responding! Status: $($response.StatusCode)" "Green"
} catch {
    Write-Log "WARNING: API not responding on localhost:3000" "Yellow"
    Write-Log "Error: $($_.Exception.Message)" "Yellow"
}

# Check APK exists
$apkPath = "$MOBILE_DIR/android/app/build/outputs/apk/debug/app-debug.apk"
if (Test-Path $apkPath) {
    $apkSize = (Get-Item $apkPath).Length
    Write-Log "APK found: $apkSize bytes ($([math]::Round($apkSize/1MB, 2)) MB)" "Green"
} else {
    Write-Log "APK NOT FOUND at $apkPath!" "Red"
    Write-Log "Building APK..." "Yellow"
    Push-Location "$MOBILE_DIR/android"
    cmd /c "gradlew assembleDebug -x lint -x test --no-daemon 2>&1" | ForEach-Object { Write-Log $_ }
    Pop-Location
}

# Run Detox tests
Write-Log "Running Detox E2E tests..." "Cyan"
$env:DETOX_RECORD_LOGS = "all"

Push-Location $ROOT_DIR
try {
    # Use the local detox CLI
    $detoxBin = "$ROOT_DIR/node_modules/.bin/detox.cmd"
    if (Test-Path $detoxBin) {
        Write-Log "Using detox.cmd at: $detoxBin" "Cyan"
        & $detoxBin test --configuration android.emu.debug --loglevel info 2>&1 | ForEach-Object { Write-Log $_ }
    } else {
        Write-Log "detox.cmd not found, trying npx..." "Yellow"
        cmd /c "npx.cmd detox test --configuration android.emu.debug --loglevel info 2>&1" | ForEach-Object { Write-Log $_ }
    }
    $exitCode = $LASTEXITCODE
} finally {
    Pop-Location
}

# Check for screenshots
Write-Log "Checking for screenshots..." "Cyan"
$screenshots = Get-ChildItem $SCREENSHOT_DIR -Filter "*.png" -ErrorAction SilentlyContinue
if ($screenshots) {
    Write-Log "Screenshots found: $($screenshots.Count)" "Green"
    foreach ($s in $screenshots) {
        Write-Log "  - $($s.Name) ($([math]::Round($s.Length/1KB, 1)) KB)" "Green"
    }
} else {
    Write-Log "No screenshots found in $SCREENSHOT_DIR" "Yellow"
}

if ($exitCode -eq 0) {
    Write-Log "All E2E tests passed!" "Green"
} else {
    Write-Log "Some E2E tests failed (exit code: $exitCode)" "Red"
}

Write-Log "Log saved to: $logFile" "Cyan"
Write-Log "Screenshots saved to: $SCREENSHOT_DIR" "Cyan"
exit $exitCode
