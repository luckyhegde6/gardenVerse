@echo off
set "JAVA_HOME=C:\jdk17\jdk-17.0.12"
set "ANDROID_HOME=C:\Users\lucky\AppData\Local\Android\Sdk"
set "PATH=%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\emulator;%ANDROID_HOME%\cmdline-tools\latest\bin;%PATH%"

mkdir "%ANDROID_HOME%\licenses" 2>nul

echo 24333f8a63b6825ea9c5514f83c2829b004d1fee > "%ANDROID_HOME%\licenses\android-sdk-license"
echo 84831b9409646a918e30573bab4c9c91346d8abd >> "%ANDROID_HOME%\licenses\android-sdk-license"
echo d56f5187479451eabf01fb78af6dfcb131a6481e >> "%ANDROID_HOME%\licenses\android-sdk-license"
echo e6b7c2ab7fa2298c15165e9583d0222b24b9ae37 >> "%ANDROID_HOME%\licenses\android-sdk-license"

echo 84831b9409646a918e30573bab4c9c91346d8abd > "%ANDROID_HOME%\licenses\android-sdk-preview-license"
echo d975f751698a77b662f1254ddbeed3901e976f5a > "%ANDROID_HOME%\licenses\intel-android-extra-license"

echo === Done accepting licenses ===
