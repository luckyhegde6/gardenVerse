$env:JAVA_HOME = "C:\jdk17\jdk-17.0.12"
$env:ANDROID_HOME = "C:\Users\lucky\AppData\Local\Android\Sdk"
$env:PATH = "$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\emulator;$env:ANDROID_HOME\cmdline-tools\latest\bin;$env:PATH"

$sdkmanager = "$env:ANDROID_HOME\cmdline-tools\latest\bin\sdkmanager.bat"
& $sdkmanager --list 2>&1 | Select-String "system-images"
