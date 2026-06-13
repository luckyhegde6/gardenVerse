$ErrorActionPreference = "Continue"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$ROOT_DIR = "F:\Local_git\gardenVerse"
$MOBILE_DIR = "$ROOT_DIR\packages\mobile"
$SCREENSHOT_DIR = "$ROOT_DIR\e2e\screenshots"
$LOG_DIR = "$ROOT_DIR\e2e\logs"
$ADB = "C:\Users\lucky\AppData\Local\Android\Sdk\platform-tools\adb.exe"

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
Write-Log "  GardenVerse E2E Test Runner v2" "Cyan"
Write-Log "========================================" "Cyan"

# ── 1. Check Emulator ──
Write-Log "Step 1: Checking emulator..." "Cyan"
$devices = & $ADB devices 2>&1 | Select-String "emulator"
if ($devices) {
    Write-Log "Emulator: $devices" "Green"
} else {
    Write-Log "No emulator! Start Pixel_7_API_34 first." "Red"
    exit 1
}

# ── 2. Install APK on emulator ──
Write-Log "Step 2: Installing APK on emulator..." "Cyan"
$apkPath = "$MOBILE_DIR\android\app\build\outputs\apk\debug\app-debug.apk"
if (Test-Path $apkPath) {
    $size = [math]::Round((Get-Item $apkPath).Length / 1MB, 2)
    Write-Log "APK: $size MB - installing..." "Cyan"
    & $ADB install -r $apkPath 2>&1 | ForEach-Object { Write-Log "  adb: $_" }
    Write-Log "APK installed!" "Green"
} else {
    Write-Log "APK not found at $apkPath" "Red"
    exit 1
}

# ── 3. Take screenshot of home screen ──
Write-Log "Step 3: Taking screenshot of emulator home..." "Cyan"
& $ADB shell screencap -p /sdcard/home.png 2>&1
& $ADB pull /sdcard/home.png "$SCREENSHOT_DIR\00-emulator-home-$timestamp.png" 2>&1
Write-Log "Screenshot: 00-emulator-home-$timestamp.png" "Green"

# ── 4. Launch app and take screenshot ──
Write-Log "Step 4: Launching app..." "Cyan"
& $ADB shell am start -n com.gardenverse.app/.MainActivity 2>&1 | ForEach-Object { Write-Log "  $_" }
Start-Sleep -Seconds 8
& $ADB shell screencap -p /sdcard/app-launched.png 2>&1
& $ADB pull /sdcard/app-launched.png "$SCREENSHOT_DIR\01-app-launched-$timestamp.png" 2>&1
Write-Log "Screenshot: 01-app-launched-$timestamp.png" "Green"

# ── 5. Take screenshot after app loads ──
Write-Log "Step 5: Taking screenshot after app loads..." "Cyan"
Start-Sleep -Seconds 5
& $ADB shell screencap -p /sdcard/app-loaded.png 2>&1
& $ADB pull /sdcard/app-loaded.png "$SCREENSHOT_DIR\02-app-loaded-$timestamp.png" 2>&1
Write-Log "Screenshot: 02-app-loaded-$timestamp.png" "Green"

# ── 6. Try to find and interact with login elements ──
Write-Log "Step 6: Checking for login screen UI..." "Cyan"
$uiDump = & $ADB shell uiautomator dump /sdcard/ui.xml 2>&1
& $ADB pull /sdcard/ui.xml "$LOG_DIR\ui-dump-$timestamp.xml" 2>&1

# Parse the UI dump to find elements
$uiContent = Get-Content "$LOG_DIR\ui-dump-$timestamp.xml" -Raw -ErrorAction SilentlyContinue
if ($uiContent) {
    # Look for login-related elements
    $loginElements = $uiContent | Select-String -Pattern 'login|email|password|sign.in|log.in' -AllMatches
    if ($loginElements) {
        Write-Log "Found login-related UI elements!" "Green"
        $loginElements.Matches | Select-Object -First 10 | ForEach-Object {
            Write-Log "  Element: $($_.Value)" "Cyan"
        }
    }

    # Look for resource-ids
    $resourceIds = $uiContent | Select-String -Pattern 'resource-id="[^"]*"' -AllMatches
    Write-Log "Found $($resourceIds.Matches.Count) resource-ids:" "Cyan"
    $resourceIds.Matches | Select-Object -First 20 | ForEach-Object {
        Write-Log "  $($_.Value)" "Gray"
    }
}

# ── 7. Take final screenshot ──
Write-Log "Step 7: Taking final screenshot..." "Cyan"
Start-Sleep -Seconds 3
& $ADB shell screencap -p /sdcard/final.png 2>&1
& $ADB pull /sdcard/final.png "$SCREENSHOT_DIR\03-final-$timestamp.png" 2>&1
Write-Log "Screenshot: 03-final-$timestamp.png" "Green"

# ── 8. List all screenshots ──
Write-Log "========================================" "Cyan"
Write-Log "Screenshots captured:" "Green"
Get-ChildItem $SCREENSHOT_DIR -Filter "*.png" | Sort-Object LastWriteTime -Descending | Select-Object -First 20 | ForEach-Object {
    Write-Log "  $($_.Name)  ($([math]::Round($_.Length/1KB,1)) KB)" "Green"
}

Write-Log "========================================" "Cyan"
Write-Log "Log: $logFile" "Cyan"
Write-Log "Screenshots: $SCREENSHOT_DIR" "Cyan"
Write-Log "UI Dump: $LOG_DIR\ui-dump-$timestamp.xml" "Cyan"
