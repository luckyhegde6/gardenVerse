@echo off
set "JAVA_HOME=C:\jdk17\jdk-17.0.12"
set "ANDROID_HOME=C:\Users\lucky\AppData\Local\Android\Sdk"
set "PATH=%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\emulator;%ANDROID_HOME%\cmdline-tools\latest\bin;%PATH%"

echo === System Images ===
"%ANDROID_HOME%\cmdline-tools\latest\bin\sdkmanager.bat" --list 2>&1 | findstr "system-images"
