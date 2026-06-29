# Local Production APK Build & Testing Guide

Build a debug APK that connects to the **production backend** (`https://gardenverse.vercel.app`) for local testing when EAS builds are unavailable.

---

## Prerequisites

| Tool | Path / Version | Check |
|------|---------------|-------|
| **Android SDK** | `C:\Users\lucky\AppData\Local\Android\Sdk` | `dir "%LOCALAPPDATA%\Android\Sdk"` |
| **Java 21+** | `C:\Program Files\Android\Android Studio\jbr` | `"%JAVA_HOME%\bin\java" -version` |
| **Android Emulator** | e.g. `Pixel_7_API_34` | `"%ANDROID_HOME%\emulator\emulator.exe" -list-avds` |
| **ADB** | Part of platform-tools | `"%ANDROID_HOME%\platform-tools\adb.exe" --version` |
| **Node.js** | 22+ | `node --version` |

---

## 1. Build Production APK

The API URL is read from `app.config.js` → `expo.extra.apiUrl`. When `APP_ENV` is unset (default), it automatically resolves to `https://gardenverse.vercel.app/api/v1`.

### Step-by-step

```powershell
cd packages/mobile

# 1. Pre-build the JS bundle (embeds JS so APK doesn't need Metro)
npx react-native bundle --platform android --dev false --entry-file index.js `
  --bundle-output android/app/src/main/assets/index.android.bundle `
  --assets-dest android/app/src/main/res

# 2. Build the debug APK
cd android
set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
gradlew.bat assembleDebug -x :expo-updates:kaptDebugKotlin -x :expo-updates:compileDebugKotlin
```

### Output

| File | Path |
|------|------|
| **arm64-v8a** (preferred) | `android/app/build/outputs/apk/debug/app-arm64-v8a-debug.apk` |
| **Universal** | `android/app/build/outputs/apk/debug/app-universal-debug.apk` |
| **x86_64** | `android/app/build/outputs/apk/debug/app-x86_64-debug.apk` |
| **armeabi-v7a** | `android/app/build/outputs/apk/debug/app-armeabi-v7a-debug.apk` |

Use the architecture-specific APK matching your device/emulator for faster install.

---

## 2. Launch Emulator

```powershell
# List available emulators
& "${env:ANDROID_HOME}\emulator\emulator.exe" -list-avds

# Start emulator (headless mode)
Start-Process -WindowStyle Hidden -FilePath "${env:ANDROID_HOME}\emulator\emulator.exe" `
  -ArgumentList "-avd Pixel_7_API_34 -no-window -no-audio -no-boot-anim -gpu swiftshader_indirect"

# Wait for boot
& "${env:ANDROID_HOME}\platform-tools\adb.exe" wait-for-device

# Unlock screen
& "${env:ANDROID_HOME}\platform-tools\adb.exe" shell input keyevent 82
```

---

## 3. Install & Launch APK

```powershell
# Install APK
& "${env:ANDROID_HOME}\platform-tools\adb.exe" install -r android/app/build/outputs/apk/debug/app-arm64-v8a-debug.apk

# Launch app
& "${env:ANDROID_HOME}\platform-tools\adb.exe" shell am start -n com.gardenverse.app/.MainActivity

# Monitor logs
& "${env:ANDROID_HOME}\platform-tools\adb.exe" logcat -c
& "${env:ANDROID_HOME}\platform-tools\adb.exe" logcat -v brief -t 200 | `
  Select-String -Pattern "ReactNative|MainActivity|com.gardenverse|axios|fetch"
```

---

## 4. Verify Production Connection

After launch, check logcat for network requests hitting the production backend:

```powershell
# Should see requests to gardenverse.vercel.app
& "${env:ANDROID_HOME}\platform-tools\adb.exe" logcat -v brief | `
  Select-String -Pattern "gardenverse.vercel.app"
```

Expected: API calls go to `https://gardenverse.vercel.app/api/v1/...`

---

## 5. Capture Screenshots

```powershell
$dir = "e2e/screenshots/mobile-prod"
mkdir -Force $dir

# Login screen
Start-Sleep 3
& "${env:ANDROID_HOME}\platform-tools\adb.exe" exec-out screencap -p > "$dir/01-login.png"

# After login
Start-Sleep 5
& "${env:ANDROID_HOME}\platform-tools\adb.exe" exec-out screencap -p > "$dir/02-garden.png"

# Marketplace tab
& "${env:ANDROID_HOME}\platform-tools\adb.exe" shell input tap 324 2260
Start-Sleep 3
& "${env:ANDROID_HOME}\platform-tools\adb.exe" exec-out screencap -p > "$dir/03-marketplace.png"

# Community tab
& "${env:ANDROID_HOME}\platform-tools\adb.exe" shell input tap 540 2260
Start-Sleep 3
& "${env:ANDROID_HOME}\platform-tools\adb.exe" exec-out screencap -p > "$dir/04-community.png"

# Profile tab
& "${env:ANDROID_HOME}\platform-tools\adb.exe" shell input tap 972 2260
Start-Sleep 3
& "${env:ANDROID_HOME}\platform-tools\adb.exe" exec-out screencap -p > "$dir/05-profile.png"
```

**Tab coordinates for 1080×2400 display with 5 tabs:**

| Tab | X | Y |
|-----|---|---|
| Garden | 108 | ~2260 |
| Marketplace | 324 | ~2260 |
| Scan | 540 | ~2260 |
| Community | 756 | ~2260 |
| Profile | 972 | ~2260 |

Adjust coordinates using `adb shell wm size` for different screen resolutions.

---

## 6. Troubleshooting

### APK install fails with `INSTALL_FAILED_UPDATE_INCOMPATIBLE`

```powershell
adb uninstall com.gardenverse.app
adb install -r app-arm64-v8a-debug.apk
```

### App shows "Could not connect to development server" (RSOD)

The JS bundle was not pre-built. Re-run step 1.1 (react-native bundle) before building.

### Gradle fails with `kaptDebugKotlin` SQLite lock error

Windows issue with Room's DatabaseVerifier. Always skip expo-updates Kotlin compilation:

```powershell
gradlew.bat assembleDebug -x :expo-updates:kaptDebugKotlin -x :expo-updates:compileDebugKotlin
```

### Emulator won't start (GPU error)

Try different GPU modes:

```powershell
# SwiftShader (best fallback)
-gpu swiftshader_indirect

# Software rendering
-gpu mesa

# Auto-detect
-gpu auto
```

### API calls failing (404 / CORS)

If the production backend doesn't receive requests:

1. Verify the APK was built with `--dev false` — development bundles don't resolve `Constants.expoConfig` correctly
2. Check logcat for the actual URL being called
3. Verify CORS on the production backend allows requests from the APK

### Login fails with demo accounts on production

The production database may not have seeded demo accounts. Use a real registered account or check the admin panel at `https://gardenverse.vercel.app/admin`.

---

## 7. Architecture: How the API URL is Resolved

```
api.ts (runtime on device)
  │
  ├── Constants.expoConfig?.extra?.apiUrl  ← app.config.js
  │     (production: https://gardenverse.vercel.app/api/v1)
  │     (development: http://localhost:3000/api/v1)
  │
  ├── Platform.OS === "android"
  │     fallback: http://10.0.2.2:3000/api/v1
  │
  └── Platform fallback
        http://localhost:3000/api/v1
```

The `expo.extra.apiUrl` field in `app.config.js` controls the target:

- **Unset / CI**: `https://gardenverse.vercel.app/api/v1`
- **`APP_ENV=development`**: `http://localhost:3000/api/v1`
- **Override**: set `API_URL` env var before `npx expo start`
