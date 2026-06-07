# ===========================================================================
# GardenVerse Mobile E2E - Environment Setup Script (Windows/PowerShell)
# ===========================================================================
# Prerequisites: Android Studio, emulator configured, adb in PATH
# Usage: .\e2e\setup-env.ps1 -Config debug -ApiTarget production
# ===========================================================================

param(
    [ValidateSet("debug", "release", "prod")]
    [string]$Config = "debug",

    [ValidateSet("localhost", "production")]
    [string]$ApiTarget = "production",

    [string]$AvdName = "Pixel_7_API_34"
)

$ErrorActionPreference = "Stop"

# ---- Android SDK paths (auto-detect or use defaults) ----
if (-not $env:ANDROID_HOME) {
    $env:ANDROID_HOME = "C:\Users\lucky\AppData\Local\Android\Sdk"
}
if (-not $env:JAVA_HOME) {
    $env:JAVA_HOME = "C:\jdk17\jdk-17.0.12"
}
$env:PATH = "$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\emulator;$env:ANDROID_HOME\cmdline-tools\latest\bin;$env:PATH"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host " GardenVerse Mobile E2E Environment Setup" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host " ANDROID_HOME: $env:ANDROID_HOME"
Write-Host " JAVA_HOME:    $env:JAVA_HOME"
Write-Host " Config:       $Config"
Write-Host " API Target:   $ApiTarget"
Write-Host " AVD:          $AvdName"

# ---- Step 1: Verify emulator exists ----
Write-Host "`n[1/5] Checking AVD..." -ForegroundColor Yellow
$avdList = & "$env:ANDROID_HOME\emulator\emulator.exe" -list-avds 2>$null
if ($avdList -notcontains $AvdName) {
    Write-Host "  AVD '$AvdName' not found. Available AVDs:" -ForegroundColor Red
    $avdList | ForEach-Object { Write-Host "    - $_" }
    Write-Host "`n  Create one in Android Studio: Tools > Device Manager > Create Device" -ForegroundColor Yellow
    exit 1
}
Write-Host "  AVD '$AvdName' found"

# ---- Step 2: Start emulator if not running ----
Write-Host "`n[2/5] Starting emulator..." -ForegroundColor Yellow
$booted = adb devices | Select-String "emulator.*device"
if (-not $booted) {
    Write-Host "  Starting emulator '$AvdName'..."
    Start-Process -FilePath "$env:ANDROID_HOME\emulator\emulator.exe" -ArgumentList "-avd", "$AvdName", "-no-window", "-no-audio", "-gpu", "swiftshader_indirect", "-no-snapshot" -WindowStyle Hidden

    Write-Host "  Waiting for emulator to boot..."
    $timeout = 180
    $elapsed = 0
    while ($elapsed -lt $timeout) {
        $bootStatus = adb shell getprop sys.boot_completed 2>$null
        if ($bootStatus -match "1") {
            Write-Host "  Emulator booted!" -ForegroundColor Green
            break
        }
        Start-Sleep -Seconds 5
        $elapsed += 5
        Write-Host "  Waiting... ($elapsed s)" -ForegroundColor Gray
    }
    if ($elapsed -ge $timeout) {
        Write-Error "Emulator did not boot within $timeout seconds."
        exit 1
    }
} else {
    Write-Host "  Emulator already running."
}

# ---- Step 3: Build APK ----
Write-Host "`n[3/5] Building APK ($Config)..." -ForegroundColor Yellow
$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $projectRoot

switch ($Config) {
    "debug" {
        Set-Location "packages/mobile/android"
        cmd /c "gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug"
    }
    "release" {
        Set-Location "packages/mobile/android"
        cmd /c "gradlew assembleRelease assembleAndroidTest -DtestBuildType=release"
    }
    "prod" {
        Set-Location "packages/mobile/android"
        cmd /c "gradlew assembleRelease"
    }
}

if ($LASTEXITCODE -ne 0) {
    Write-Error "APK build failed!"
    exit 1
}
Set-Location $projectRoot
Write-Host "  APK built successfully!" -ForegroundColor Green

# ---- Step 4: Configure API URL ----
Write-Host "`n[4/5] Configuring API endpoint..." -ForegroundColor Yellow
if ($ApiTarget -eq "production") {
    Write-Host "  API URL: https://gardenverse.vercel.app/api/v1 (production)" -ForegroundColor Green
} else {
    Write-Host "  API URL: http://10.0.2.2:3000/api/v1 (localhost via emulator)" -ForegroundColor Yellow
    Write-Host "  Make sure admin server is running on localhost:3000!"
}

# ---- Step 5: Summary ----
Write-Host "`n[5/5] Setup complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host " Run tests with:"
Write-Host "  cd packages/mobile"
Write-Host "  npx detox test --configuration android.emu.$Config"
Write-Host "============================================" -ForegroundColor Cyan
