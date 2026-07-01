# build-quick.ps1 — Quick APK build for Android emulator
# Fast path: bundle JS → skip kapt → assembleDebug with arm64-v8a only
#
# Usage:
#   .\scripts\build-quick.ps1          # Full build (bundle + gradle)
#   .\scripts\build-quick.ps1 -SkipBundle  # Gradle only (if bundle already built)

param(
    [switch]$SkipBundle,
    [string]$JavaHome = "C:\jdk17\jdk-17.0.12",
    [string]$AndroidHome = "$env:LOCALAPPDATA\Android\Sdk"
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $ScriptDir

# ── Colored output helpers ──────────────────────────────────────────
function Write-Step($msg) {
    Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "  $msg" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
}

function Write-Info($msg) {
    Write-Host "  [INFO] $msg" -ForegroundColor White
}

function Write-Ok($msg) {
    Write-Host "  [OK]   $msg" -ForegroundColor Green
}

function Write-Error($msg) {
    Write-Host "  [FAIL] $msg" -ForegroundColor Red
}

# ── Environment setup ───────────────────────────────────────────────
$env:JAVA_HOME = $JavaHome
$env:ANDROID_HOME = $AndroidHome
$env:PATH = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\cmdline-tools\latest\bin;$env:PATH"

$BundleOut = "android\app\src\main\assets\index.android.bundle"
$BundleAssets = "android\app\src\main\res"
$ApkOut = "android\app\build\outputs\apk\debug\app-arm64-v8a-debug.apk"

Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║    GardenVerse Quick APK Builder         ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Info "JAVA_HOME:      $env:JAVA_HOME"
Write-Info "ANDROID_HOME:   $env:ANDROID_HOME"
Write-Info "Working dir:    $ScriptDir"
Write-Host ""

$TotalTimer = [System.Diagnostics.Stopwatch]::StartNew()

# ── Step 1: Bundle JS ───────────────────────────────────────────────
if (-not $SkipBundle) {
    Write-Step "Step 1/2: Building JS bundle"

    $BundleTimer = [System.Diagnostics.Stopwatch]::StartNew()

    # Use @react-native-community/cli — NOT npx react-native (hangs on Windows)
    $NpxCmd = "npx.cmd"
    $BundleArgs = @(
        "@react-native-community/cli", "bundle",
        "--platform", "android",
        "--dev", "false",
        "--entry-file", "index.js",
        "--bundle-output", $BundleOut,
        "--assets-dest", $BundleAssets,
        "--reset-cache",
        "--max-workers", "2"
    )

    # Set NODE_OPTIONS to avoid OOM on large node_modules
    $env:NODE_OPTIONS = "--max-old-space-size=4096"

    Write-Info "Running: $NpxCmd $($BundleArgs -join ' ')"

    $proc = Start-Process -FilePath $NpxCmd -ArgumentList $BundleArgs -NoNewWindow -Wait -PassThru

    if ($proc.ExitCode -ne 0) {
        Write-Error "JS bundle failed with exit code $($proc.ExitCode)"
        exit 1
    }

    $BundleTimer.Stop()
    $BundleSecs = [math]::Round($BundleTimer.Elapsed.TotalSeconds, 1)

    if (Test-Path $BundleOut) {
        $BundleSize = (Get-Item $BundleOut).Length
        $BundleSizeMB = [math]::Round($BundleSize / 1MB, 1)
        Write-Ok "JS bundle built in ${BundleSecs}s — ${BundleSizeMB}MB"
    } else {
        Write-Error "Bundle output not found at $BundleOut"
        exit 1
    }
} else {
    Write-Step "Step 1/2: Skipping JS bundle (--SkipBundle flag)"
    if (-not (Test-Path $BundleOut)) {
        Write-Error "No pre-built bundle found at $BundleOut. Run without -SkipBundle first."
        exit 1
    }
    $BundleSize = (Get-Item $BundleOut).Length
    $BundleSizeMB = [math]::Round($BundleSize / 1MB, 1)
    Write-Info "Using existing bundle: ${BundleSizeMB}MB"
}

# ── Step 2: Gradle assembleDebug ────────────────────────────────────
Write-Step "Step 2/2: Running Gradle assembleDebug (arm64-v8a)"

$GradleTimer = [System.Diagnostics.Stopwatch]::StartNew()

Set-Location -LiteralPath (Join-Path $ScriptDir "android")

# The kapt workaround: skip expo-updates kapt task
# (Room DatabaseVerifier SQLiteJDBCLoader crashes in forked worker on Windows)
$GradleArgs = @(
    "assembleDebug",
    "-PreactNativeArchitectures=arm64-v8a",
    "-x", ":expo-updates:kaptDebugKotlin",
    "-x", "lint",
    "-x", "test",
    "--no-daemon",
    "--max-workers", "2"
)

Write-Info "Running: gradlew.bat $($GradleArgs -join ' ')"
Write-Info "This may take 3-8 minutes..."

$proc = Start-Process -FilePath "cmd" -ArgumentList "/c gradlew.bat $($GradleArgs -join ' ')" -NoNewWindow -Wait -PassThru

$GradleTimer.Stop()
$GradleSecs = [math]::Round($GradleTimer.Elapsed.TotalSeconds, 1)

$TotalTimer.Stop()
$TotalSecs = [math]::Round($TotalTimer.Elapsed.TotalSeconds, 1)

if ($proc.ExitCode -eq 0) {
    Write-Ok "Gradle build succeeded (${GradleSecs}s)"

    if (Test-Path $ApkOut) {
        $ApkSize = (Get-Item $ApkOut).Length
        $ApkSizeMB = [math]::Round($ApkSize / 1MB, 1)
        Write-Ok "APK: $ApkOut"
        Write-Ok "Size: ${ApkSizeMB}MB"
        Write-Ok "Total build time: ${TotalSecs}s"
    } else {
        # Check for fallback APK name
        $FallbackApk = "android\app\build\outputs\apk\debug\app-debug.apk"
        if (Test-Path $FallbackApk) {
            $ApkSize = (Get-Item $FallbackApk).Length
            $ApkSizeMB = [math]::Round($ApkSize / 1MB, 1)
            Write-Ok "APK (fallback): $FallbackApk"
            Write-Ok "Size: ${ApkSizeMB}MB"
            Write-Ok "Total build time: ${TotalSecs}s"
        } else {
            Write-Error "APK not found at expected paths."
            Write-Info "Check android\app\build\outputs\apk\debug\ for output files"
            Get-ChildItem "android\app\build\outputs\apk\debug\*.apk" -ErrorAction SilentlyContinue | ForEach-Object {
                Write-Info "  Found: $($_.Name) ($([math]::Round($_.Length / 1MB, 1))MB)"
            }
            exit 1
        }
    }
} else {
    Write-Error "Gradle build failed with exit code $($proc.ExitCode) (${GradleSecs}s)"
    Write-Info "Check build logs in android\build_log.txt or android\build_result*.log"
    exit 1
}

Write-Host "`n✅ Done!" -ForegroundColor Green
