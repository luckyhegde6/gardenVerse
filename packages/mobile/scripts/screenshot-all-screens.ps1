<#
.SYNOPSIS
    Take screenshots of all GardenVerse app screens on an Android emulator.
.DESCRIPTION
    Logs in with demo credentials, navigates each tab, and captures screenshots.
    Saves screenshots to e2e/screenshots/ with descriptive filenames.

.PARAMETER AndroidHome
    Path to Android SDK (default: %LOCALAPPDATA%\Android\Sdk)
.PARAMETER AppPackage
    Android app package name (default: com.gardenverse.app)
.PARAMETER MainActivity
    Main activity name (default: .MainActivity)
.PARAMETER ScreenshotDir
    Output directory for screenshots
.PARAMETER Email
    Demo login email (default: demo@gardenverse.vercel.app)
.PARAMETER Password
    Demo login password (default: password123)
.PARAMETER WaitBetween
    Seconds to wait between screenshots for UI transitions (default: 3)
.PARAMETER NoLogin
    Skip login — just screenshot current state

.EXAMPLE
    .\scripts\screenshot-all-screens.ps1
    .\scripts\screenshot-all-screens.ps1 -Email admin@gardenverse.vercel.app -Password password123
#>

param(
    [string]$AndroidHome = "$env:LOCALAPPDATA\Android\Sdk",
    [string]$AppPackage = "com.gardenverse.app",
    [string]$MainActivity = ".MainActivity",
    [string]$ScreenshotDir = "",
    [string]$Email = "demo@gardenverse.vercel.app",
    [string]$Password = "password123",
    [int]$WaitBetween = 3,
    [switch]$NoLogin
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $PSScriptRoot

if (-not $ScreenshotDir) {
    $ScreenshotDir = Join-Path (Resolve-Path "$ScriptDir\..\..\e2e\screenshots") ""
}

# ── Tool paths ──────────────────────────────────────────────────────
$Adb = Join-Path $AndroidHome "platform-tools\adb.exe"

# ── Helpers ─────────────────────────────────────────────────────────
function Write-Step($msg) {
    Write-Host "`n━━━ $msg ━━━" -ForegroundColor Cyan
}
function Write-Ok($msg) {
    Write-Host "  [OK] $msg" -ForegroundColor Green
}
function Write-Info($msg) {
    Write-Host "  [..] $msg" -ForegroundColor White
}
function Write-Error($msg) {
    Write-Host "  [FAIL] $msg" -ForegroundColor Red
}

function Get-ScreenSize {
    $raw = & $Adb shell wm size 2>&1
    if ($raw -match "(\d+)x(\d+)") {
        return @{ Width = [int]$Matches[1]; Height = [int]$Matches[2] }
    }
    return @{ Width = 1080; Height = 1920 }
}

function Take-Screenshot($Name) {
    $file = Join-Path $ScreenshotDir $Name
    & $Adb shell screencap -p /sdcard/screenshot.png 2>&1 | Out-Null
    & $Adb pull /sdcard/screenshot.png $file 2>&1 | Out-Null
    if (Test-Path $file) {
        $size = (Get-Item $file).Length
        $sizeKB = [math]::Round($size / 1KB, 1)
        Write-Ok "Screenshot: $Name ($sizeKB KB)"
    } else {
        Write-Warn "Screenshot failed: $Name"
    }
}

function Tap-Screen($x, $y) {
    & $Adb shell input tap $x $y 2>&1 | Out-Null
}

function Swipe-Screen($x1, $y1, $x2, $y2, $durationMs = 300) {
    & $Adb shell input swipe $x1 $y1 $x2 $y2 $durationMs 2>&1 | Out-Null
}

function Type-Text($text) {
    # Escape special characters for ADB
    $escaped = $text -replace "'", "''"
    & $Adb shell input text "$escaped" 2>&1 | Out-Null
}

function Press-Key($key) {
    # Keycodes: 66=ENTER, 4=BACK, 3=HOME, 61=TAB, 67=DEL, 22=DPAD_RIGHT
    & $Adb shell input keyevent $key 2>&1 | Out-Null
}

function Clear-Text {
    # Select all + delete
    & $Adb shell input keyevent 112 2>&1 | Out-Null  # KEYCODE_META_LEFT
    Start-Sleep -Milliseconds 200
    & $Adb shell input keyevent 29 2>&1 | Out-Null   # KEYCODE_A (select all with meta)
    Start-Sleep -Milliseconds 200
    & $Adb shell input keyevent 67 2>&1 | Out-Null   # KEYCODE_DEL
    Start-Sleep -Milliseconds 200
}

function Wait-And-Dump($label = "") {
    Start-Sleep -Seconds $WaitBetween
}

# ── Main ────────────────────────────────────────────────────────────
Write-Host "╔══════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   GardenVerse Screenshot All Screens        ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Ensure dirs exist
if (-not (Test-Path $ScreenshotDir)) {
    New-Item -ItemType Directory -Path $ScreenshotDir -Force | Out-Null
}

# Check emulator
$Devices = & $Adb devices 2>&1 | Where-Object { $_ -match "emulator-\d+\s+device" }
if (-not $Devices) {
    Write-Error "No emulator running. Start one first with scripts/test-apk.ps1"
    exit 1
}
Write-Info "Emulator detected"

# Get screen dimensions for coordinate math
$Screen = Get-ScreenSize
$SW = $Screen.Width
$SH = $Screen.Height
Write-Info "Screen: ${SW}x${SH}"

# ── Coordinate helpers (relative to screen size) ───────────────────
function X($pct) { return [int]($SW * $pct) }
function Y($pct) { return [int]($SH * $pct) }

# Tab bar is at bottom of screen (~7-10% of height from bottom)
$TabY = Y(0.935)

# Tab X positions (6 tabs evenly spaced)
function Tab-X($index) {
    $tabWidth = $SW / 6
    return [int]($tabWidth * ($index + 0.5))
}

# ── Restart app fresh ──────────────────────────────────────────────
Write-Step "Step 1: Restarting app"

& $Adb shell am force-stop $AppPackage 2>&1 | Out-Null
Start-Sleep -Seconds 1
& $Adb shell pm clear $AppPackage 2>&1 | Out-Null
Start-Sleep -Seconds 1
& $Adb shell am start -n "${AppPackage}/${MainActivity}" -W 2>&1 | Out-Null
Write-Info "App restarted with cleared data"
Wait-And-Dump "app start"

Take-Screenshot "00_splash_or_login.png"

if (-not $NoLogin) {
    # ── Login ───────────────────────────────────────────────────────
    Write-Step "Step 2: Login"

    # Tap the email field (roughly at top 30-35% of screen)
    Write-Info "Tapping email field..."
    Tap-Screen X(0.5) Y(0.32)
    Start-Sleep -Milliseconds 500
    Type-Text $Email
    Start-Sleep -Milliseconds 300

    # Tap the password field (roughly at top 40-45% of screen)
    Write-Info "Tapping password field..."
    Tap-Screen X(0.5) Y(0.42)
    Start-Sleep -Milliseconds 500
    Type-Text $Password
    Start-Sleep -Milliseconds 300

    # Tap Login button (roughly at top 50-55% of screen)
    Write-Info "Tapping Login button..."
    Tap-Screen X(0.5) Y(0.52)
    Write-Info "Waiting for login to complete..."
    Start-Sleep -Seconds 5

    Take-Screenshot "01_after_login.png"
    Wait-And-Dump "after login"
}

# ── Navigate each tab ──────────────────────────────────────────────
$Tabs = @(
    @{ Name = "garden";         Index = 0;  Desc = "Garden tab"      },
    @{ Name = "marketplace";    Index = 1;  Desc = "Marketplace tab"  },
    @{ Name = "scanner";        Index = 2;  Desc = "Scanner tab"      },
    @{ Name = "community";      Index = 3;  Desc = "Community tab"    },
    @{ Name = "events";         Index = 4;  Desc = "Events tab"       },
    @{ Name = "profile";        Index = 5;  Desc = "Profile tab"      }
)

foreach ($tab in $Tabs) {
    $tabNum = $tab.Index + 1
    Write-Step "Step $($tabNum + 2): $($tab.Desc)"

    $x = Tab-X($tab.Index)

    Write-Info "Tapping tab $($tab.Index) at X=$x Y=$TabY"

    # Tap the tab
    Tap-Screen $x $TabY
    Wait-And-Dump "navigating to $($tab.Name)"

    # Take screenshot
    Take-Screenshot "02_${tabNum}_$($tab.Name).png"

    # If it's the garden tab, try an extra detail shot
    if ($tab.Name -eq "garden") {
        # Try to tap a crop if visible (center of grid, roughly at 40-50% height)
        Write-Info "Tapping garden center for crop detail..."
        Tap-Screen X(0.5) Y(0.45)
        Wait-And-Dump "garden crop tap"
        Take-Screenshot "02a_garden_crop_selected.png"

        # Try action buttons (water/fertilize) if visible
        # Usually water is at ~30% left, 55% height
        Write-Info "Tapping Water action..."
        Tap-Screen X(0.3) Y(0.55)
        Wait-And-Dump "water action"
        Take-Screenshot "02b_garden_water_action.png"
    }

    # If profile tab, try opening a sub-section
    if ($tab.Name -eq "profile") {
        # Profile usually has an "Inventory" or "Settings" button
        # Tap roughly in the middle of the screen which might show details
        Write-Info "Tapping profile center..."
        Tap-Screen X(0.5) Y(0.4)
        Wait-And-Dump "profile tap"
        Take-Screenshot "05a_profile_detail.png"
    }
}

# ── Final done ──────────────────────────────────────────────────────
Write-Step "Done"
Write-Ok "All screenshots captured in $ScreenshotDir"
Write-Info ""
Write-Info "Files:"
Get-ChildItem $ScreenshotDir -Filter "*.png" | Sort-Object Name | ForEach-Object {
    $size = [math]::Round($_.Length / 1KB, 1)
    Write-Info "  $($_.Name) ($size KB)"
}
