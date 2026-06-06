@echo off
set "JAVA_HOME=C:\jdk17\jdk-17.0.12"
set "ANDROID_HOME=C:\Users\lucky\AppData\Local\Android\Sdk"
set "PATH=%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\emulator;%ANDROID_HOME%\cmdline-tools\latest\bin;%PATH%"

echo === Installing system image ===
echo y | "%ANDROID_HOME%\cmdline-tools\latest\bin\sdkmanager.bat" "system-images;android-34;google_apis;x86_64"

echo === Accepting licenses ===
echo y | "%ANDROID_HOME%\cmdline-tools\latest\bin\sdkmanager.bat" --licenses

echo === Creating AVD ===
echo no | "%ANDROID_HOME%\cmdline-tools\latest\bin\avdmanager.bat" create avd -n Pixel_7_API_34 -k "system-images;android-34;google_apis;x86_64" -d "pixel_7" --force

echo === Done ===
