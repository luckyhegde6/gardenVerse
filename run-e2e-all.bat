@echo off
setlocal enabledelayedexpansion

echo ========================================
echo  GardenVerse E2E Test Runner
echo  %date% %time%
echo ========================================

set ROOT_DIR=%~dp0
set MOBILE_DIR=%ROOT_DIR%packages\mobile
set E2E_DIR=%ROOT_DIR%e2e\mobile
set SCREENSHOT_DIR=%ROOT_DIR%e2e\screenshots
set LOG_DIR=%ROOT_DIR%e2e\logs

if not exist "%SCREENSHOT_DIR%" mkdir "%SCREENSHOT_DIR%"
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

set TIMESTAMP=%date:~-4%%date:~4,2%%date:~7,2%-%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set LOG_FILE=%LOG_DIR%\e2e-%TIMESTAMP%.log

echo [%time%] Starting E2E test run... >> "%LOG_FILE%"

:: Check emulator
echo Checking Android emulator...
"C:\Users\lucky\AppData\Local\Android\Sdk\platform-tools\adb.exe" devices 2>&1 | findstr "emulator" >nul
if %ERRORLEVEL% neq 0 (
    echo No emulator detected. Starting emulator...
    start /min "" "C:\Users\lucky\AppData\Local\Android\Sdk\emulator\emulator.exe" -avd Pixel_7_API_34 -no-snapshot-load
    echo Waiting for emulator to boot...
    "C:\Users\lucky\AppData\Local\Android\Sdk\platform-tools\adb.exe" wait-for-device
    timeout /t 30 /nobreak >nul
)
echo Emulator ready.

:: Check if admin API is running
echo Checking admin API...
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:3000/api/v1/health' -TimeoutSec 3 -ErrorAction Stop; exit 0 } catch { exit 1 }" 2>nul
if %ERRORLEVEL% neq 0 (
    echo Admin API not running. Starting...
    start /min cmd /c "cd /d %ROOT_DIR%packages\admin && npx next dev"
    echo Waiting for API to start...
    timeout /t 20 /nobreak >nul

    :: Check again
    powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:3000/api/v1/health' -TimeoutSec 3 -ErrorAction Stop; exit 0 } catch { exit 1 }" 2>nul
    if %ERRORLEVEL% neq 0 (
        echo WARNING: Admin API still not responding. Tests may fail.
    ) else (
        echo Admin API is running!
    )
) else (
    echo Admin API is running!
)

:: Check APK
if exist "%MOBILE_DIR%\android\app\build\outputs\apk\debug\app-debug.apk" (
    echo APK found.
) else (
    echo Building APK...
    cd /d "%MOBILE_DIR%\android"
    call gradlew assembleDebug -x lint -x test --no-daemon
    if %ERRORLEVEL% neq 0 (
        echo ERROR: APK build failed!
        exit /b 1
    )
)

:: Run Detox tests
echo.
echo ========================================
echo  Running Detox E2E Tests
echo ========================================
cd /d "%ROOT_DIR%"

:: Fix: use full path to jest
set JEST_PATH=%ROOT_DIR%node_modules\.bin\jest.cmd
set DETOX_CONFIG=e2e/jest.config.js

echo Using Jest at: %JEST_PATH%
echo Using Detox config: %DETOX_CONFIG%

:: Run detox with explicit jest path
node "%ROOT_DIR%node_modules\detox\local-cli\cli.js" test --configuration android.emu.debug --loglevel info 2>&1

set TEST_EXIT=%ERRORLEVEL%

:: Check for screenshots
echo.
echo ========================================
echo  Screenshot Results
echo ========================================
dir /b "%SCREENSHOT_DIR%\*.png" 2>nul
set SCREENSHOT_COUNT=0
for %%f in ("%SCREENSHOT_DIR%\*.png") do set /a SCREENSHOT_COUNT+=1
echo Total screenshots: %SCREENSHOT_COUNT%

if %TEST_EXIT% equ 0 (
    echo.
    echo ========================================
    echo  ALL TESTS PASSED!
    echo ========================================
) else (
    echo.
    echo ========================================
    echo  SOME TESTS FAILED (exit code: %TEST_EXIT%)
    echo ========================================
)

echo.
echo Log file: %LOG_FILE%
echo Screenshots: %SCREENSHOT_DIR%
echo.

exit /b %TEST_EXIT%
