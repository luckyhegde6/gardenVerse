@echo off
REM build-apk.bat — Build GardenVerse debug APK for Android emulator
REM
REM Fast path: pre-build JS bundle with @react-native-community/cli,
REM skip expo-updates kapt task (crashes on Windows), skip lint/tests.
REM Output: android\app\build\outputs\apk\debug\app-arm64-v8a-debug.apk
REM
REM Usage:
REM   build-apk.bat                       Full build (bundle + gradle)
REM   build-apk.bat skipbundle            Gradle only (reuse existing bundle)
REM   build-apk.bat skipbundle skipkapt   Gradle, skip kapt (if already excluded)

setlocal enabledelayedexpansion

set JAVA_HOME=C:\jdk17\jdk-17.0.12
set ANDROID_HOME=C:\Users\lucky\AppData\Local\Android\Sdk
set PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\cmdline-tools\latest\bin;%PATH%

cd /d "%~dp0"

set SKIP_BUNDLE=%~1
set SKIP_KAPT=%~2

echo ╔══════════════════════════════════════════╗
echo ║    GardenVerse APK Builder               ║
echo ╚══════════════════════════════════════════╝
echo.
echo JAVA_HOME:    %JAVA_HOME%
echo ANDROID_HOME: %ANDROID_HOME%
echo.
echo Starting: %DATE% %TIME%
echo.

set BUNDLE_FILE=android\app\src\main\assets\index.android.bundle
set APK_OUT=android\app\build\outputs\apk\debug\app-arm64-v8a-debug.apk

rem ── STEP 1: Build JS Bundle ──────────────────────────────────────
if /I "%SKIP_BUNDLE%"=="skipbundle" (
    echo [SKIP] Skipping JS bundle (skipbundle flag)
    if not exist "%BUNDLE_FILE%" (
        echo [ERROR] No pre-built bundle found at %BUNDLE_FILE%
        echo Run without skipbundle flag first.
        pause
        exit /b 1
    )
) else (
    echo ─── Step 1/2: Building JS bundle ────────────────────────
    echo.

    set NODE_OPTIONS=--max-old-space-size=4096

    echo Running: npx @react-native-community/cli bundle --platform android --dev false ...
    echo.

    call npx.cmd @react-native-community/cli bundle ^
        --platform android ^
        --dev false ^
        --entry-file index.js ^
        --bundle-output "%BUNDLE_FILE%" ^
        --assets-dest android\app\src\main\res ^
        --reset-cache ^
        --max-workers 2

    if %ERRORLEVEL% neq 0 (
        echo [ERROR] JS bundle failed with exit code %ERRORLEVEL%
        pause
        exit /b %ERRORLEVEL%
    )

    for %%F in ("%BUNDLE_FILE%") do set BUNDLE_SIZE=%%~zF
    set /a BUNDLE_MB = BUNDLE_SIZE / (1024*1024)
    echo [OK] JS bundle built: %BUNDLE_FILE% (~!BUNDLE_MB! MB)
    echo.
)

rem ── STEP 2: Gradle assembleDebug ─────────────────────────────────
echo ─── Step 2/2: Running Gradle assembleDebug ─────────────────
echo.

cd android

set GRADLE_ARGS=assembleDebug -x lint -x test --no-daemon --max-workers 2

rem Skip expo-updates kapt task (Room DBVerifier crashes on Windows)
if /I "%SKIP_KAPT%"=="skipkapt" (
    set GRADLE_ARGS=%GRADLE_ARGS% -x :expo-updates:kaptDebugKotlin
    echo [INFO] Skipping expo-updates kapt task
) else (
    echo [INFO] Including expo-updates kapt task (may fail on some Windows setups)
    echo [INFO] If it fails, run: build-apk.bat skipbundle skipkapt
)

echo Running: gradlew.bat %GRADLE_ARGS%
echo This may take 3-8 minutes...
echo.

echo %DATE% %TIME% - Starting Gradle build > build_log.txt

call gradlew.bat %GRADLE_ARGS% 2>&1 >> build_log.txt

set BUILD_EXIT=%ERRORLEVEL%
echo Build exit code: %BUILD_EXIT%
echo %DATE% %TIME% - Build finished with exit code %BUILD_EXIT% >> build_log.txt

cd ..

if %BUILD_EXIT% equ 0 (
    echo.
    if exist "%APK_OUT%" (
        for %%F in ("%APK_OUT%") do (
            set APK_SIZE=%%~zF
            set /a APK_MB = APK_SIZE / (1024*1024)
            echo [OK] APK built successfully: %APK_OUT% (!APK_MB! MB)
        )
    ) else (
        rem Try fallback universal APK name
        set FALLBACK=android\app\build\outputs\apk\debug\app-debug.apk
        if exist "!FALLBACK!" (
            for %%F in ("!FALLBACK!") do (
                set APK_SIZE=%%~zF
                set /a APK_MB = APK_SIZE / (1024*1024)
                echo [OK] APK built (fallback path): !FALLBACK! (!APK_MB! MB)
            )
        ) else (
            echo [WARN] APK not found at expected paths.
            echo Checking for any APK outputs...
            dir android\app\build\outputs\apk\debug\*.apk 2>nul
        )
    )
) else (
    echo [ERROR] Gradle build failed with exit code %BUILD_EXIT%
    echo Check build logs: android\build_log.txt
)

echo.
echo Build finished: %DATE% %TIME%
echo For emulator testing: .\scripts\test-apk.ps1

pause
