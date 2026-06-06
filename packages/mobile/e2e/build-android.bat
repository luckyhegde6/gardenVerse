@echo off
set "JAVA_HOME=C:\jdk17\jdk-17.0.12"
set "ANDROID_HOME=C:\Users\lucky\AppData\Local\Android\Sdk"
set "NODE_EXE=C:\Program Files\nodejs\node.exe"
set "PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\platform-tools;C:\Program Files\nodejs;%PATH%"

echo [1/5] Checking Java...
java -version

echo [2/5] Checking Node...
node --version

echo [3/5] Running expo prebuild...
cd /d F:\Local_git\gardenVerse\packages\mobile
call npx expo prebuild --platform android --clean

echo [4/5] Building debug APK...
cd android
call gradlew.bat assembleDebug assembleAndroidTest -DtestBuildType=debug --no-daemon

echo [5/5] Done!
dir /s /b app\build\outputs\apk\*.apk
