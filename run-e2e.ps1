$ErrorActionPreference = "Continue"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$ROOT_DIR = "F:\Local_git\gardenVerse"
$MOBILE_DIR = "$ROOT_DIR\packages\mobile"
$E2E_DIR = "$ROOT_DIR\e2e\mobile"
$SCREENSHOT_DIR = "$ROOT_DIR\e2e\screenshots"
$LOG_DIR = "$ROOT_DIR\e2e\logs"
$ADB = "C:\Users\lucky\AppData\Local\Android\Sdk\platform-tools\adb.exe"
$EMULATOR = "C:\Users\lucky\AppData\Local\Android\Sdk\emulator\emulator.exe"

New-Item -ItemType Directory -Force -Path $SCREENSHOT_DIR | Out-Null
New-Item -ItemType Directory -Force -Path $LOG_DIR | Out-Null

$timestamp = Get-Date -Format "yyyy-MM-dd-HH-mm-ss"
$logFile = "$LOG_DIR\e2e-$timestamp.log"

function Write-Log($msg, $color = "White") {
    $line = "[$(Get-Date -Format 'HH:mm:ss')] $msg"
    Add-Content -Path $logFile -Value $line
    Write-Host $line -ForegroundColor $color
}

Write-Log "========================================" "Cyan"
Write-Log "  GardenVerse E2E Test Runner" "Cyan"
Write-Log "========================================" "Cyan"

# ── 1. Check/Start Emulator ──
Write-Log "Step 1: Checking Android emulator..." "Cyan"
$devices = & $ADB devices 2>&1 | Select-String "emulator"
if (-not $devices) {
    Write-Log "Starting emulator..." "Yellow"
    Start-Process -FilePath $EMULATOR -ArgumentList "-avd", "Pixel_7_API_34", "-no-snapshot-load" -WindowStyle Minimized
    & $ADB wait-for-device
    Start-Sleep -Seconds 30
    Write-Log "Emulator booted!" "Green"
} else {
    Write-Log "Emulator already running: $devices" "Green"
}

# Verify boot complete
$bootComplete = & $ADB shell getprop sys.boot_completed 2>&1
Write-Log "Boot complete: $bootComplete" "Cyan"

# ── 2. Check/Start Admin API ──
Write-Log "Step 2: Checking admin API..." "Cyan"
$apiOk = $false
try {
    $r = Invoke-WebRequest -Uri "http://localhost:3000/api/v1/health" -TimeoutSec 3 -ErrorAction Stop
    $apiOk = $true
    Write-Log "API responding! Status: $($r.StatusCode)" "Green"
} catch {
    Write-Log "API not responding, starting..." "Yellow"
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c cd /d $ROOT_DIR\packages\admin && npx next dev" -WindowStyle Minimized
    Start-Sleep -Seconds 20
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:3000/api/v1/health" -TimeoutSec 5 -ErrorAction Stop
        $apiOk = $true
        Write-Log "API started! Status: $($r.StatusCode)" "Green"
    } catch {
        Write-Log "WARNING: API still not responding" "Red"
    }
}

# ── 3. Verify APK ──
Write-Log "Step 3: Verifying APK..." "Cyan"
$apkPath = "$MOBILE_DIR\android\app\build\outputs\apk\debug\app-debug.apk"
if (Test-Path $apkPath) {
    $size = [math]::Round((Get-Item $apkPath).Length / 1MB, 2)
    Write-Log "APK found: $size MB" "Green"
} else {
    Write-Log "APK not found! Building..." "Yellow"
    Push-Location "$MOBILE_DIR\android"
    & cmd /c "gradlew assembleDebug -x lint -x test --no-daemon 2>&1"
    Pop-Location
}

# ── 4. Run Detox Tests ──
Write-Log "Step 4: Running Detox E2E tests..." "Cyan"
Set-Location $ROOT_DIR

# Build the test command - use full paths
$detoxCli = "$ROOT_DIR\node_modules\detox\local-cli\cli.js"
$jestPath = "$ROOT_DIR\node_modules\.bin\jest.cmd"

Write-Log "Detox CLI: $detoxCli" "Cyan"
Write-Log "Jest: $jestPath" "Cyan"

# Run detox - it will use the jest from its own config
$process = Start-Process -FilePath "node" -ArgumentList $detoxCli, "test", "--configuration", "android.emu.debug", "--loglevel", "info" -NoNewWindow -PassThru -RedirectStandardOutput "$LOG_DIR\detox-stdout-$timestamp.log" -RedirectStandardError "$LOG_DIR\detox-stderr-$timestamp.log"
$process.WaitForExit()
$exitCode = $process.ExitCode

# Output the logs
Write-Log "--- Detox stdout ---" "Cyan"
Get-Content "$LOG_DIR\detox-stdout-$timestamp.log" -ErrorAction SilentlyContinue | ForEach-Object { Write-Log $_ }
Write-Log "--- Detox stderr ---" "Cyan"
Get-Content "$LOG_DIR\detox-stderr-$timestamp.log" -ErrorAction SilentlyContinue | ForEach-Object { Write-Log $_ }

# ── 5. Screenshot Results ──
Write-Log "Step 5: Checking screenshots..." "Cyan"
$screenshots = Get-ChildItem $SCREENSHOT_DIR -Filter "*.png" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending
if ($screenshots) {
    Write-Log "Found $($screenshots.Count) screenshots:" "Green"
    foreach ($s in $screenshots | Select-Object -First 20) {
        Write-Log "  $($s.Name)  ($([math]::Round($s.Length/1KB,1)) KB)" "Green"
    }
} else {
    Write-Log "No screenshots found" "Yellow"
}

# ── 6. Summary ──
Write-Log "========================================" "Cyan"
if ($exitCode -eq 0) {
    Write-Log "ALL TESTS PASSED!" "Green"
} else {
    Write-Log "TESTS FAILED (exit code: $exitCode)" "Red"
}
Write-Log "Log: $logFile" "Cyan"
Write-Log "Screenshots: $SCREENSHOT_DIR" "Cyan"

exit $exitCode
