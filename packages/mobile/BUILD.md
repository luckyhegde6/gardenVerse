# GardenVerse Mobile Build Guide

Build, test, and deploy the GardenVerse React Native app to Android emulators and devices.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Quick Build Command](#2-quick-build-command)
3. [Full Build Steps](#3-full-build-steps)
4. [Installing on Emulator](#4-installing-on-emulator)
5. [Taking Screenshots](#5-taking-screenshots)
6. [Known Issues and Workarounds](#6-known-issues-and-workarounds)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. Prerequisites

| Tool | Version | Path |
|------|---------|------|
| **JDK** | 17+ (17.0.12 recommended) | `C:\jdk17\jdk-17.0.12` |
| **Android SDK** | API 34+ | `C:\Users\lucky\AppData\Local\Android\Sdk` |
| **Android Emulator** | Pixel_7_API_34 | Created via AVD Manager |
| **Node.js** | 22+ | via `nvm` or installer |
| **npm** | 10+ | Comes with Node.js |

### Verify Prerequisites

```powershell
# Check Java
java -version
# Should show: openjdk version "17.0.12" ...

# Check Android SDK
echo $env:ANDROID_HOME
# Should show: C:\Users\lucky\AppData\Local\Android\Sdk

# Check emulator AVDs
& "C:\Users\lucky\AppData\Local\Android\Sdk\emulator\emulator.exe" -list-avds
# Should show: Pixel_7_API_34
```

### Environment Variables

The build scripts set these automatically, but for manual builds ensure they are set:

```cmd
set JAVA_HOME=C:\jdk17\jdk-17.0.12
set ANDROID_HOME=C:\Users\lucky\AppData\Local\Android\Sdk
set PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\platform-tools;%PATH%
```

---

## 2. Quick Build Command

### Option A: PowerShell Script (recommended)

```powershell
cd packages\mobile
.\scripts\build-quick.ps1
```

Takes ~5-10 minutes on first build, ~3-5 minutes on subsequent builds.

### Option B: Bundle then Gradle separately (for debugging builds)

```powershell
# Step 1: Build only the JS bundle (fast, ~30s-1min)
cd packages/mobile
npx @react-native-community/cli bundle --platform android --dev false --entry-file app/index.ts --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res --reset-cache --max-workers 2

# Step 2: Run only Gradle (reuses existing bundle)
.\scripts\build-quick.ps1 -SkipBundle
```

### Option C: Pre-built bundle + direct Gradle (avoids Metro hang)

```powershell
# 1. Bundle separately (if you need a new bundle)
cd packages\mobile
npx @react-native-community/cli bundle --platform android --dev false --entry-file app\index.ts --bundle-output android\app\src\main\assets\index.android.bundle --assets-dest android\app\src\main\res --reset-cache --max-workers 2

# 2. Run Gradle build in a SEPARATE terminal (to avoid build output hang)
cd packages\mobile\android
.\gradlew.bat assembleDebug -PreactNativeArchitectures=arm64-v8a -x :expo-updates:kaptDebugKotlin -x lint -x test --no-daemon --max-workers 2
```

**Always run Gradle in a separate terminal or subagent** to avoid the agent getting stuck on 4+ minutes of build output.

### Output

Successful build produces one of:

```
android/app/build/outputs/apk/debug/app-arm64-v8a-debug.apk  (~70-90 MB, Hermes)
android/app/build/outputs/apk/debug/app-debug.apk            (~190 MB, legacy)
```

---

## 3. Full Build Steps

The build process has two stages:

### Stage 1: JS Bundle

Combines all JavaScript/TypeScript code into a single bundle file.

```cmd
set NODE_OPTIONS=--max-old-space-size=4096
npx @react-native-community/cli bundle ^
    --platform android ^
    --dev false ^
    --entry-file app/index.ts ^
    --bundle-output android/app/src/main/assets/index.android.bundle ^
    --assets-dest android/app/src/main/res ^
    --reset-cache ^
    --max-workers 2
```

**Why `@react-native-community/cli` instead of `npx react-native bundle`?**

Metro 0.80.x has a bug on Windows where the file crawler hangs indefinitely when scanning `node_modules` in a monorepo. The `@react-native-community/cli` package handles this correctly.

**Why `--dev false`?**

Hermes is disabled for debug builds (see [app/build.gradle](android/app/build.gradle) line 50), so the bundle is plain JavaScript, not Hermes bytecode. Using `--dev false` produces a smaller, faster bundle for debugging.

### Stage 2: Gradle APK Assembly

Compiles Java/Kotlin source and packages everything into an APK.

```cmd
cd android
gradlew.bat assembleDebug ^
    -PreactNativeArchitectures=arm64-v8a ^
    -x :expo-updates:kaptDebugKotlin ^
    -x lint ^
    -x test ^
    --no-daemon ^
    --max-workers 2
```

**Flags explained:**

| Flag | Purpose |
|------|---------|
| `-PreactNativeArchitectures=arm64-v8a` | Build only arm64 (smaller APK, emulator supports ARM translation) |
| `-x :expo-updates:kaptDebugKotlin` | Skip Room DBVerifier kapt task (crashes on Windows — see known issues) |
| `-x lint` | Skip linting to speed up build |
| `-x test` | Skip unit tests during build |
| `--no-daemon` | Avoid stale daemon issues between builds |
| `--max-workers 2` | Limit parallel workers to avoid OOM on Windows |

---

## 4. Installing on Emulator

### Quick Deploy

```powershell
cd packages/mobile
.\scripts\test-apk.ps1
```

This script:
1. Checks if `Pixel_7_API_34` emulator is running; starts it if not
2. Installs the latest debug APK
3. Launches the app (`com.gardenverse.app/.MainActivity`)
4. Takes a screenshot and saves to `e2e/screenshots/mobile_test_{timestamp}.png`
5. Starts logcat filtered to the app package

### Manual Installation

```powershell
# Install APK
adb install -r -d packages/mobile/android/app/build/outputs/apk/debug/app-arm64-v8a-debug.apk

# Launch app
adb shell am start -n "com.gardenverse.app/.MainActivity"

# View logs
adb logcat --pid=$(adb shell pidof -s com.gardenverse.app) -v threadtime

# Take screenshot
adb shell screencap -p /sdcard/screenshot.png
adb pull /sdcard/screenshot.png screenshot.png

# Clear app data (fresh start)
adb shell pm clear com.gardenverse.app
```

### Reinstall After Build

```powershell
.\scripts\test-apk.ps1 -SkipEmulatorCheck
```

---

## 5. Taking Screenshots

### One-Click Screenshot of All Screens

```powershell
cd packages/mobile
.\scripts\screenshot-all-screens.ps1
```

This script:
1. Restarts the app with cleared data
2. Logs in with demo credentials (`demo@gardenverse.vercel.app` / `password123`)
3. Navigates through all 6 tabs (Garden, Market, Scan, Community, Events, Profile)
4. Takes screenshots at each step
5. Saves to `e2e/screenshots/` with descriptive names

### Custom Credentials

```powershell
.\scripts\screenshot-all-screens.ps1 -Email admin@gardenverse.vercel.app -Password password123
```

### Custom Wait Time

```powershell
.\scripts\screenshot-all-screens.ps1 -WaitBetween 5
```

### Only Screenshot Current State (Skip Login)

```powershell
.\scripts\screenshot-all-screens.ps1 -NoLogin
```

### One-Off Screenshot

```powershell
# Quick adb screencap
adb shell screencap -p /sdcard/screenshot.png
adb pull /sdcard/screenshot.png e2e/screenshots/quick_test.png
```

---

## 6. Known Issues and Workarounds

### Issue 1: Metro 0.80 File Crawl Hang

**Symptom:** `npx react-native bundle` hangs forever (no output for 5+ minutes).

**Root cause:** Metro 0.80.x file crawler has a bug on Windows with large `node_modules` directories in monorepos.

**Workaround:** Use `@react-native-community/cli` instead:

```powershell
npx @react-native-community/cli bundle --platform android --dev false --entry-file app/index.ts --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res --reset-cache --max-workers 2
```

The `app/build.gradle` already sets `cliFile` to `@react-native-community/cli` for the same reason (line 45).

### Issue 2: expo-updates kapt Crash

**Symptom:** Gradle fails with a crash in `expo-updates:kaptDebugKotlin` task related to SQLite lock file.

**Root cause:** `Room DatabaseVerifier` starts a forked worker process where `java.io.tmpdir` defaults to `C:\Windows\` (not writable). The SQLiteJDBCLoader tries to write a lock file there and crashes.

**Workaround:** Skip the kapt task:

```cmd
gradlew.bat assembleDebug -x :expo-updates:kaptDebugKotlin
```

This is safe because `expo-updates` is disabled in the AndroidManifest (`ENABLED="false"`).

**Note:** Setting `kapt.use.worker.api=false` in `gradle.properties` (already done) doesn't fix this because the Room processor uses its own worker fork mechanism.

### Issue 3: Kotlin Daemon Fallback

**Symptom:** Build succeeds but Gradle shows `Kotlin daemon connection refused, using fallback`.

**Cause:** The Kotlin daemon port conflicts when running multiple builds in quick succession.

**Resolution:** This is harmless — the build succeeds with the fallback. To avoid it, wait 30s between builds or kill stale daemon processes:

```powershell
taskkill /F /IM kotlin-daemon* 2>nul
```

### Issue 4: useState Crash with Notification Panel

**Symptom:** App crashes with `TypeError: Cannot read property 'useContext' of null` when a notification opens.

**Root cause:** React version mismatch in development/emulator builds. The Expo dev build bundles a different React version than the native runtime.

**Workaround:** This only affects dev builds. Production APK builds (`eas build --profile production`) embed the correct JS bundle and don't have this issue. For emulator testing, close the notification panel before interacting with the app.

### Issue 5: Gradle OOM on Large node_modules

**Symptom:** `OutOfMemoryError: Java heap space` during Gradle build.

**Workaround:** Limit workers and memory:

```
# In gradle.properties (already set):
org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m

# When running:
--max-workers 2
```

### Issue 6: ADB Device Offline

**Symptom:** `adb devices` shows the emulator as `offline`.

**Resolution:**

```powershell
adb kill-server
adb start-server
# Wait for emulator to reconnect
```

### Issue 7: App Installs but Shows White Screen / Crashes Immediately

**Root cause:** The JS bundle may be missing, stale, or built with the wrong entry point.

**Resolution:**

```powershell
# Rebuild JS bundle
npx @react-native-community/cli bundle --platform android --dev false --entry-file app/index.ts --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res --reset-cache --max-workers 2

# Reinstall
adb install -r -d android/app/build/outputs/apk/debug/app-arm64-v8a-debug.apk

# Check logs
adb logcat --pid=$(adb shell pidof -s com.gardenverse.app) -v threadtime | findstr "ReactNative\|CRASH\|AndroidRuntime"
```

### Issue 8: Emulator Cannot Reach Local API (10.0.2.2 Unreachable)

**Symptom:** API calls from the emulator to `http://10.0.2.2:3000` fail with `Network is unreachable`.

**Root cause:** On some Windows hosts, the emulator's special alias `10.0.2.2` (which maps to host localhost) does not route properly.

**Workaround:** Use `adb reverse` to forward the emulator port to the host, and change the API URL to `localhost`:

```powershell
# Forward emulator port to host
& "C:\Users\lucky\AppData\Local\Android\Sdk\platform-tools\adb.exe" -s emulator-5554 reverse tcp:3000 tcp:3000

# In api.ts, use localhost instead of 10.0.2.2:
# const DEV_API_URL = "http://localhost:3000/api/v1"
```

The source file `packages/mobile/src/services/api.ts` now uses `localhost:3000` for both Android and iOS.

### Issue 9: Dual Storage Backend Causes Auth Token Mismatch

**Symptom:** Login succeeds (POST /api/v1/auth/login 200) but subsequent API calls return 401 because the token is not sent in the `Authorization` header.

**Root cause:** The app had two storage modules:
- `services/storage.ts` — uses `@react-native-async-storage/async-storage`
- `utils/storage.ts` — uses `expo-secure-store`

The auth store (`stores/authStore.ts`) stored tokens via `services/storage` (AsyncStorage), but the API interceptor (`services/api.ts`) read tokens from `utils/storage` (SecureStore). The token was never found by the interceptor.

**Fix:** `utils/storage.ts` now re-exports from `services/storage.ts`, so all modules use AsyncStorage consistently:

```typescript
// utils/storage.ts (entire file)
export { getItem, setItem, removeItem, StorageKeys } from "../services/storage";
```

### Issue 10: getUseDeveloperSupport = false Required for Pre-built Bundle

**Symptom:** When running a debug APK with `debuggableVariants = []` (skip Metro), the app shows a RedBox: `Cannot connect to Metro server`.

**Root cause:** Expo dev client calls `getUseDeveloperSupport()` to decide whether to load from Metro (port 8081) or the pre-built asset bundle. When `BuildConfig.DEBUG` is true (debug build), Expo tries Metro first and shows a RedBox when it's unreachable — it does NOT gracefully fall back.

**Workaround:** Override `getUseDeveloperSupport()` to always return `false` in `MainApplication.kt`:

```kotlin
override fun getUseDeveloperSupport(): Boolean = false
```

This forces the app to load `index.android.bundle` from assets directly, bypassing the Metro check entirely.

---

### Build Fails at JS Bundle Step

```
npm ERR! 404 Not Found - GET https://registry.npmjs.org/@react-native-community%2fcli
```

**Fix:** The `@react-native-community/cli` package might not be installed. Install it:

```powershell
npm install --save-dev @react-native-community/cli
```

Or it may be hoisted to the root `node_modules`:

```powershell
npm install -w packages/mobile --save-dev @react-native-community/cli
```

### Build Fails at Gradle Step

Check the build log:

```powershell
Get-Content android/build_log.txt | Select-Object -Last 40
```

Common errors:

| Error | Fix |
|-------|-----|
| `Could not get unknown property 'release'` | Run `node scripts/postinstall.js` to patch expo-modules-core |
| `Could not find react-native/package.json` | Run `node scripts/postinstall.js` to patch expo-updates |
| `Kotlin daemon connection refused` | Ignore (harmless), or wait 30s between builds |
| `Unsupported class file major version` | Use JDK 17, not JDK 21+ |
| `com.android.builder.testing.api.DeviceException` | Emulator disconnected during build — restart it |

### Postinstall Patches

After `npm install`, run the postinstall script to patch Expo packages:

```powershell
cd packages/mobile
node scripts/postinstall.js
```

This patches:
1. `expo-modules-core`: Fixes `components.release` → `components.findByName("release")`
2. `expo-updates`: Fixes `getRNVersion()` to search multiple paths for `react-native/package.json`

### Full Reset

If everything is broken, do a full reset:

```powershell
# 1. Kill all Node and Java processes (careful — kills opencode too)
taskkill /F /IM java.exe 2>nul
taskkill /F /IM node.exe 2>nul

# 2. Clean Gradle cache
cd packages/mobile/android
.\gradlew.bat clean

# 3. Delete old build artifacts
Remove-Item -Recurse -Force .gradle, app/build -ErrorAction SilentlyContinue

# 4. Reinstall npm dependencies
cd packages/mobile
npm install
node scripts/postinstall.js

# 5. Rebuild
.\scripts\build-quick.ps1
```

---

## Command Reference

### Quick Reference

```powershell
# ── Build ──────────────────────────────────────────
.\scripts\build-quick.ps1                    # Full build (bundle + gradle)
.\scripts\build-quick.ps1 -SkipBundle        # Gradle only
build-apk.bat                                # CMD equivalent
build-apk.bat skipbundle                     # Gradle only (CMD)

# ── Deploy ─────────────────────────────────────────
.\scripts\test-apk.ps1                       # Install + launch + screenshot
.\scripts\test-apk.ps1 -SkipEmulatorCheck    # Emulator already running
.\scripts\test-apk.ps1 -ScreenshotOnly       # Just screenshot current state

# ── Screenshot ─────────────────────────────────────
.\scripts\screenshot-all-screens.ps1         # Login + all tabs
.\scripts\screenshot-all-screens.ps1 -NoLogin   # Current state only

# ── Manual ─────────────────────────────────────────
adb install -r -d android/app/build/outputs/apk/debug/app-arm64-v8a-debug.apk
adb shell am start -n "com.gardenverse.app/.MainActivity"
adb logcat --pid=$(adb shell pidof -s com.gardenverse.app) -v threadtime
```
