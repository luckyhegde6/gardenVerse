$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"

# Build debug APK with x86_64 support for emulator
.\gradlew assembleDebug "-PreactNativeArchitectures=x86_64,arm64-v8a" --no-daemon
