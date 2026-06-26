# GardenVerse Android APK

## Current Build

| Property | Value |
|----------|-------|
| **Version** | app-arm64-v8a-debug.apk (debug, Hermes) |
| **APK size** | ~81 MB |
| **Build date** | Jun 27, 2026 |
| **Target SDK** | 34 |
| **Min SDK** | 26 |
| **JS Engine** | Hermes |
| **Entry point** | `app/index.ts` |

## Build Fixes Applied

### 1. Hermes JS Engine (fixes `new Promise` crash)
JSC (JavaScriptCore) on Android has a lexical `Promise` binding bug where `new Promise(...)` evaluates to `undefined`. Switched to Hermes (`hermesEnabled = true` in `app/build.gradle`), which provides native `Promise` support.

### 2. Storage Unification (fixes 401 on API calls)
The app had two storage modules (`utils/storage` → `expo-secure-store`, `services/storage` → `@react-native-async-storage/async-storage`). Auth store used AsyncStorage, but API interceptor read from SecureStore. Fixed by making `utils/storage.ts` re-export from `services/storage.ts`.

### 3. `getUseDeveloperSupport() = false` (fixes Metro RedBox)
Expo dev client checks `getUseDeveloperSupport()` to decide whether to load from Metro. In debug builds it defaults to `true`, causing a RedBox when Metro (port 8081) is unreachable. Overridden in `MainApplication.kt` to return `false`, forcing asset bundle loading.

### 4. Emulator Network (fixes API connectivity)
`10.0.2.2:3000` is unreachable from the emulator. Changed API URL to `localhost:3000` and use `adb reverse tcp:3000 tcp:3000` to forward the port.

### 5. `expo-updates:kaptDebugKotlin` crash on Windows
Room's `DatabaseVerifier` forks a worker process where `java.io.tmpdir` defaults to `C:\WINDOWS\` (not writable), crashing the SQLite lock file write. Workaround: skip the task with `-x :expo-updates:kaptDebugKotlin`.

## Build Command

```powershell
cd packages\mobile\android
.\gradlew.bat assembleDebug -PreactNativeArchitectures=arm64-v8a -x :expo-updates:kaptDebugKotlin -x lint -x test --no-daemon --max-workers 2
```

## Install & Test

```powershell
# Install
& "C:\Users\lucky\AppData\Local\Android\Sdk\platform-tools\adb.exe" -s emulator-5554 install -r packages\mobile\android\app\build\outputs\apk\debug\app-arm64-v8a-debug.apk

# Forward API port
& "C:\Users\lucky\AppData\Local\Android\Sdk\platform-tools\adb.exe" -s emulator-5554 reverse tcp:3000 tcp:3000

# Launch
& "C:\Users\lucky\AppData\Local\Android\Sdk\platform-tools\adb.exe" -s emulator-5554 shell am start -n com.gardenverse.app/.MainActivity

# View logs
& "C:\Users\lucky\AppData\Local\Android\Sdk\platform-tools\adb.exe" -s emulator-5554 logcat --pid=$(& adb shell pidof com.gardenverse.app)
```
