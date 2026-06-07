@echo off
set JAVA_HOME=C:\jdk17\jdk-17.0.12
set ANDROID_HOME=C:\Users\lucky\AppData\Local\Android\Sdk
set PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\cmdline-tools\latest\bin;%PATH%
cd /d "%~dp0"
echo Building APK with JAVA_HOME=%JAVA_HOME%
echo.
cd android
call gradlew.bat assembleDebug -x lint -x test --no-daemon 2>&1
echo.
echo Build exit code: %ERRORLEVEL%
if %ERRORLEVEL% equ 0 (
    echo.
    echo APK location: android\app\build\outputs\apk\debug\app-debug.apk
)
pause
