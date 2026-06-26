# test-apk.ps1 — Install APK on emulator, launch, screenshot, and monitor
#
# Usage:
#   .\scripts\test-apk.ps1                           # Use default paths
#   .\scripts\test-apk.ps1 -ApkPath "path\to\app.apk"
#   .\scripts\test-apk.ps1 -SkipEmulatorCheck         # If emulator is already running
#   .\scripts\test-apk.ps1 -ScreenshotOnly            # Just take screenshot of current state

param(
    [string]$ApkPath = "",
    [string]$AndroidHome = "$env:LOCALAPPDATA\Android\Sdk",
    [string]$AvdName = "Pixel_7_API_34",
    [string]$AppPackage = "com.gardenverse.app",
    [string]$MainActivity = ".MainActivity",
    [string]$ScreenshotDir = "",
    [switch]$SkipEmulatorCheck,
    [switch]$ScreenshotOnly
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $PSScriptRoot

# ── Defaults ────────────────────────────────────────────────────────
if (-not $ApkPath) {
    # Try arm64-v8a first, fall back to universal debug APK
    $ArmApk = Join-Path $ScriptDir "android\app\build\outputs\apk\debug\app-arm64-v8a-debug.apk"
    $UniversalApk = Join-Path $ScriptDir "android\app\build\outputs\apk\debug\app-debug.apk"
    if (Test-Path $ArmApk) {
        $ApkPath = $ArmApk
    } elseif (Test-Path $UniversalApk) {
        $ApkPath = $UniversalApk
    } else {
        Write-Error "No APK found. Build first with: .\scripts\build-quick.ps1"
        exit 1
    }
}

if (-not $ScreenshotDir) {
    $ScreenshotDir = Join-Path (Resolve-Path "$ScriptDir\..\..\e2e\screenshots") ""
}

# ── Tool paths ──────────────────────────────────────────────────────
$Adb = Join-Path $AndroidHome "platform-tools\adb.exe"
$Emulator = Join-Path $AndroidHome "emulator\emulator.exe"

# ── Color helpers ───────────────────────────────────────────────────
function Write-Step($msg) {
    Write-Host "`n━━━ $msg ━━━" -ForegroundColor Cyan
}
function Write-Ok($msg) {
    Write-Host "  [OK] $msg" -ForegroundColor Green
}
function Write-Info($msg) {
    Write-Host "  [..] $msg" -ForegroundColor White
}
function Write-Warn($msg) {
    Write-Host "  [!]  $msg" -ForegroundColor Yellow
}
function Write-Error($msg) {
    Write-Host "  [FAIL] $msg" -ForegroundColor Red
}

Write-Host "╔══════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║      GardenVerse Emulator Test Script        ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ── Step 1: Ensure emulator is running ──────────────────────────────
if (-not $ScreenshotOnly) {
    if (-not $SkipEmulatorCheck) {
        Write-Step "Step 1: Checking emulator"

        $Devices = & $Adb devices 2>&1 | Where-Object { $_ -match "emulator-\d+\s+device" }
        if ($Devices) {
            Write-Ok "Emulator already running: $($Devices -join ', ')"
        } else {
            Write-Info "No emulator running. Starting $AvdName..."

            # Kill any zombie adb and start fresh
            & $Adb kill-server 2>&1 | Out-Null
            Start-Sleep -Seconds 2

            $EmuProc = Start-Process -FilePath $Emulator -ArgumentList "-avd", $AvdName, "-no-snapshot", "-no-boot-anim" -NoNewWindow -PassThru
            Write-Info "Waiting for emulator to boot (this may take 30-90s)..."

            # Wait up to 120s for boot to complete
            $BootTimeout = 120
            $Waited = 0
            $Booted = $false
            while ($Waited -lt $BootTimeout) {
                Start-Sleep -Seconds 5
                $Waited += 5
                try {
                    $BootCompleted = & $Adb shell getprop sys.boot_completed 2>&1
                    if ($BootCompleted -match "1") {
                        $Booted = $true
                        break
                    }
                } catch {
                    # adb not ready yet, keep waiting
                }
                Write-Info "  ... waited ${Waited}s for boot"
            }

            if (-not $Booted) {
                Write-Error "Emulator did not boot within ${BootTimeout}s"
                Write-Info "Check: $Emulator -avd $AvdName"
                exit 1
            }
            Write-Ok "Emulator booted (${Waited}s)"
        }
    } else {
        Write-Info "Skipping emulator check (--SkipEmulatorCheck)"
    }

    # ── Step 2: Install APK ─────────────────────────────────────────
    Write-Step "Step 2: Installing APK"

    if (-not (Test-Path $ApkPath)) {
        Write-Error "APK not found: $ApkPath"
        exit 1
    }

    $ApkSize = (Get-Item $ApkPath).Length
    $ApkSizeMB = [math]::Round($ApkSize / 1MB, 1)
    Write-Info "APK: $ApkPath ($ApkSizeMB MB)"

    Write-Info "Running: adb install -r ..."
    $InstallResult = & $Adb install -r -d $ApkPath 2>&1
    if ($InstallResult -match "Success") {
        Write-Ok "APK installed"
    } else {
        Write-Warn "Install output: $($InstallResult -join ' ')"

        # Retry with uninstall first if install fails
        Write-Info "Retrying: uninstall then install..."
        & $Adb uninstall $AppPackage 2>&1 | Out-Null
        Start-Sleep -Seconds 2
        $InstallResult = & $Adb install -r -d $ApkPath 2>&1
        if ($InstallResult -match "Success") {
            Write-Ok "APK installed (after reinstall)"
        } else {
            Write-Error "APK install failed: $($InstallResult -join ' ')"
            exit 1
        }
    }

    # ── Step 3: Launch app ──────────────────────────────────────────
    Write-Step "Step 3: Launching app"

    # Force stop then launch clean
    & $Adb shell am force-stop $AppPackage 2>&1 | Out-Null
    Start-Sleep -Seconds 1
    & $Adb shell am start -n "${AppPackage}/${MainActivity}" -W 2>&1 | Out-Null
    Write-Ok "App launched ($AppPackage/$MainActivity)"
    Write-Info "Waiting 5s for UI to render..."
    Start-Sleep -Seconds 5
}

# ── Step 4: Screenshot ─────────────────────────────────────────────
Write-Step "Step 4: Taking screenshot"

# Ensure screenshot directory exists
if (-not (Test-Path $ScreenshotDir)) {
    New-Item -ItemType Directory -Path $ScreenshotDir -Force | Out-Null
}

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$ScreenshotFile = Join-Path $ScreenshotDir "mobile_test_${Timestamp}.png"

& $Adb shell screencap -p /sdcard/screenshot.png 2>&1 | Out-Null
& $Adb pull /sdcard/screenshot.png $ScreenshotFile 2>&1 | Out-Null

if (Test-Path $ScreenshotFile) {
    $ScreenshotSize = (Get-Item $ScreenshotFile).Length
    $ScreenshotSizeKB = [math]::Round($ScreenshotSize / 1KB, 1)
    Write-Ok "Screenshot saved: $ScreenshotFile ($ScreenshotSizeKB KB)"
} else {
    Write-Warn "Screenshot capture failed"
}

# ── Step 5: Open logcat (non-blocking) ─────────────────────────────
if (-not $ScreenshotOnly) {
    Write-Step "Step 5: Starting logcat monitor"

    $LogFile = Join-Path $ScreenshotDir "logcat_${Timestamp}.txt"
    Write-Info "Logcat output: $LogFile"
    Write-Info "Filtering for package: $AppPackage"
    Write-Info ""
    Write-Host "  ── logcat is streaming. Press Ctrl+C to stop. ──" -ForegroundColor Yellow
    Write-Host ""

    # Run logcat in the foreground (user can Ctrl+C)
    & $Adb logcat --pid=$(& $Adb shell pidof -s $AppPackage 2>&1) -v threadtime 2>&1 | Tee-Object -FilePath $LogFile
}

Write-Step "Done"
Write-Ok "Script completed"
