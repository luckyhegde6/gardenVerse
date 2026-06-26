---
name: mobile-apk-test
description: Build APK, install on emulator, test all screens, capture screenshots, analyze for features/A/B testing
version: 1.0.0
---

# Mobile APK Testing Workflow

End-to-end workflow for building a debug APK, deploying to an Android emulator, navigating all screens, capturing screenshot evidence, and analyzing results for feature planning and A/B testing.

---

## Prerequisites

- Android SDK + emulator image installed (e.g., `system-images;android-34;google_apis;x86_64`)
- Emulator created (e.g., `Pixel_7_API_34`)
- Project dependencies installed (`npm install`)
- `.env` file with API endpoint pointing to running backend or production

---

## 1. Build Debug APK

### 1.1 Pre-build JS bundle (avoids Metro runtime dependency)

```bash
cd packages/mobile
npx react-native bundle --platform android --dev false --entry-file index.js ^
  --bundle-output android/app/src/main/assets/index.android.bundle ^
  --assets-dest android/app/src/main/res
```

This embeds the JS bundle so the APK doesn't need a Metro dev server at runtime. Without this, tab-based lazy navigation will show a **React Native Red Screen of Death (RSOD)** when loading screens not included in the initial bundle.

### 1.2 Build APK with Gradle

```bash
cd packages/mobile/android
set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
gradlew.bat assembleDebug -x :expo-updates:kaptDebugKotlin -x :expo-updates:compileDebugKotlin
```

Key flags:
- `-x :expo-updates:kaptDebugKotlin` — Skips Room database annotation processor that crashes on Windows (SQLite lock file in `C:\WINDOWS\`)
- `-x :expo-updates:compileDebugKotlin` — Skips Kotlin compilation for expo-updates (not needed for debug)

### 1.3 Locate APK output

```bash
Get-ChildItem -Recurse -Filter "*.apk" packages/mobile/android/app/build/outputs/apk/
```

Prefer the architecture-specific APK (e.g., `app-arm64-v8a-debug.apk`) over the universal one — it's smaller and installs faster.

---

## 2. Launch Emulator

### 2.1 List available emulators

```bash
& "${env:ANDROID_HOME}\emulator\emulator.exe" -list-avds
```

### 2.2 Start emulator headless

```bash
Start-Process -WindowStyle Hidden -FilePath "${env:ANDROID_HOME}\emulator\emulator.exe" ^
  -ArgumentList "-avd Pixel_7_API_34 -no-window -no-audio -no-boot-anim -gpu swiftshader_indirect"
```

Flags:
- `-no-window` — Runs headless (no GUI window). Omit to see the emulator screen.
- `-no-audio` — Suppresses audio
- `-no-boot-anim` — Skips boot animation for faster startup
- `-gpu swiftshader_indirect` — Software GPU rendering (works without host GPU passthrough)

### 2.3 Wait for boot completion

```bash
& "${env:ANDROID_HOME}\platform-tools\adb.exe" wait-for-device
$bootComplete = $false
while (-not $bootComplete) {
  Start-Sleep -Seconds 2
  $prop = & "${env:ANDROID_HOME}\platform-tools\adb.exe" shell getprop sys.boot_completed
  if ($prop.Trim() -eq "1") { $bootComplete = $true }
}
```

### 2.4 Unlock screen (emulator may be locked)

```bash
& "${env:ANDROID_HOME}\platform-tools\adb.exe" shell input keyevent 82
```

This sends a MENU keyevent which unlocks most emulator lock screens.

---

## 3. Install and Launch APK

### 3.1 Install APK

```bash
& "${env:ANDROID_HOME}\platform-tools\adb.exe" install -r "path\to\app-arm64-v8a-debug.apk"
```

`-r` replaces the app if already installed.

### 3.2 Launch app

```bash
& "${env:ANDROID_HOME}\platform-tools\adb.exe" shell am start -n com.gardenverse.mobile/.MainActivity
```

### 3.3 (Alternative) Launch with debug intent for Metro

```bash
& "${env:ANDROID_HOME}\platform-tools\adb.exe" shell am start -n com.gardenverse.mobile/.MainActivity ^
  --es devMenuEnabled true
```

### 3.4 Monitor logcat for launch diagnostics

```bash
& "${env:ANDROID_HOME}\platform-tools\adb.exe" logcat -c  # Clear buffer
& "${env:ANDROID_HOME}\platform-tools\adb.exe" logcat -v brief -t 200 | Select-String -Pattern "ReactNative|SoLoader|GestureHandler|MainActivity|com.gardenverse"
```

Key log patterns to check:
- **`ReactNativeJS`** — JS runtime messages (console.log from app code)
- **`SoLoader`** — Native library loading (pass/fail)
- **`GestureHandler`** — Gesture handler initialization
- **`MainActivity`** — Activity lifecycle (RESUMED = launched successfully)
- **`com.gardenverse`** — App-specific tags

Diagnostic signals:
| Signal | Meaning | Action |
|--------|---------|--------|
| `MainActivity: onResume` / `ActivityThread: ActivityRecord RESUMED` | App launched successfully | ✅ |
| `launchFailed=false` in `IntentLaunch` | No crash during launch | ✅ |
| `GestureHandler: Init completed` | react-native-gesture-handler OK | ✅ |
| `SoLoader: init start` | Native libs loading | ✅ |
| `TrafficStats: tagSocket` | Network requests happening (~4s intervals = API polling) | ✅ |
| `FATAL EXCEPTION` / `Process: com.gardenverse, PID:` | App crashed | ❌ |
| `ANR in com.gardenverse` | App Not Responding | ❌ |
| `Could not connect to development server` | Lazy module load failed — needs pre-bundled JS | ⚠️ |

---

## 4. Test Screens

### 4.1 Login Screen

Navigate to the login screen via URL scheme or direct activity:

```bash
# If app supports deep links
adb shell am start -d "gardenverse://login"
```

Wait for the login form to render. Look for:
- Email/password text inputs
- Login button
- Potential "Create account" link

To log in programmatically:
```bash
# Tap email field (coordinates depend on screen layout)
adb shell input tap 540 400
adb shell input text "demo@gardenverse.vercel.app"

# Tap password field
adb shell input tap 540 520
adb shell input text "password123"

# Tap login button
adb shell input tap 540 640
```

### 4.2 Garden Screen (core experience)

After login, verify:
- 6×6 plot grid renders (visible immediately, even if empty)
- 2D/3D toggle works
- Weather bar shows at top
- Growth overlay at bottom
- Collections/progress sections below the grid

Test actions:
- **Tap empty plot** → Should navigate to plant crop screen
- **Tap planted crop** → Should select it (show action buttons)
- **Double-tap selected crop** → Should go to crop detail
- **Water/Fertilize/Harvest buttons** → Should show with correct state

### 4.3 Marketplace Screen

Navigate via bottom tab. Verify:
- Listings load from API (check logcat for network calls)
- Each listing shows title, price, seller
- Create listing button present

### 4.4 Scanner Screen

Navigate via bottom tab or floating button. Verify:
- Camera permission prompt appears
- Fallback UI renders (if camera unavailable in emulator)

### 4.5 Community Screen

Navigate via bottom tab. Verify:
- Groups section renders
- Leaderboard or events sections present

### 4.6 Profile Screen

Navigate via bottom tab. **Note:** This screen often triggers React Navigation lazy loading. If the APK was built without pre-bundling the JS, the profile screen may show an RSOD: *"Could not connect to development server"*.

If this happens, rebuild the APK with the JS bundle (step 1.1).

---

## 5. Capture Screenshots

### 5.1 Take screenshot via adb

```bash
& "${env:ANDROID_HOME}\platform-tools\adb.exe" exec-out screencap -p > "screenshot_name.png"
```

### 5.2 Systematic screen capture workflow

```powershell
$screenshotDir = "e2e/screenshots/mobile"
New-Item -ItemType Directory -Path $screenshotDir -Force

# 1. Login screen
Start-Sleep -Seconds 3
& "${env:ANDROID_HOME}\platform-tools\adb.exe" exec-out screencap -p > "$screenshotDir/01-login.png"

# 2. After login — garden
Start-Sleep -Seconds 5
& "${env:ANDROID_HOME}\platform-tools\adb.exe" exec-out screencap -p > "$screenshotDir/02-garden.png"

# 3. Walkthrough steps (if applicable)
# Step 1: Welcome
& "${env:ANDROID_HOME}\platform-tools\adb.exe" shell input tap 540 700  # Next button
Start-Sleep -Seconds 2
& "${env:ANDROID_HOME}\platform-tools\adb.exe" exec-out screencap -p > "$screenshotDir/03-walkthrough-welcome.png"

# ... continue for each step

# 4. Marketplace tab
& "${env:ANDROID_HOME}\platform-tools\adb.exe" shell input tap 540 1900  # Tab bar position
Start-Sleep -Seconds 3
& "${env:ANDROID_HOME}\platform-tools\adb.exe" exec-out screencap -p > "$screenshotDir/04-marketplace.png"

# 5. Scanner tab
& "${env:ANDROID_HOME}\platform-tools\adb.exe" shell input tap 180 1900
Start-Sleep -Seconds 3
& "${env:ANDROID_HOME}\platform-tools\adb.exe" exec-out screencap -p > "$screenshotDir/05-scanner.png"

# 6. Community tab
& "${env:ANDROID_HOME}\platform-tools\adb.exe" shell input tap 360 1900
Start-Sleep -Seconds 3
& "${env:ANDROID_HOME}\platform-tools\adb.exe" exec-out screencap -p > "$screenshotDir/06-community.png"

# 7. Profile tab
& "${env:ANDROID_HOME}\platform-tools\adb.exe" shell input tap 720 1900
Start-Sleep -Seconds 3
& "${env:ANDROID_HOME}\platform-tools\adb.exe" exec-out screencap -p > "$screenshotDir/07-profile.png"
```

### 5.3 Resolve tab coordinates dynamically

Tab positions vary by device width. To compute them:

```bash
# Get screen width/height
adb shell wm size

# Common tab layouts for 1080w:
# 4 tabs: positions at 20%, 40%, 60%, 80% of width
# 5 tabs: positions at 10%, 30%, 50%, 70%, 90% of width
# Tab Y coordinate = screen height - ~140 (bottom nav height)
```

For a 1080×2400 display with 5 tabs:
- Tab 1: x=108, y=2260
- Tab 2: x=324, y=2260
- Tab 3: x=540, y=2260 (center)
- Tab 4: x=756, y=2260
- Tab 5: x=972, y=2260

---

## 6. Extract Info from Screenshots

### 6.1 Using MarkItDown for OCR analysis

```bash
# Analyze a screenshot
npx markitdown screenshot.png > screenshot-analysis.txt

# Or use the skill
npm run skill:markitdown screenshot.png
```

### 6.2 What to look for in each screenshot

| Screen | Check | Signals |
|--------|-------|---------|
| **Login** | Form fields visible? Login button tappable? | Layout ok, credentials needed |
| **Garden** | Grid renders? Empty or planted plots? Error messages? | Growth engine running, data fetching |
| **Walkthrough** | All 5 steps render? Progress dots? Skip button? | Onboarding UX complete |
| **Marketplace** | Listings load? Price/seller visible? Empty state? | API integration |
| **Scanner** | Camera UI or fallback? Permission prompt? | Camera integration |
| **Community** | Groups/leaderboard render? Loading state? | API integration |
| **Profile** | Stats load? Garden summary? Activity feed? | Auth/profile pipeline |

### 6.3 Log analysis for network calls

```bash
# Filter network requests
adb logcat -v brief | Select-String "TrafficStats|OkHttp|Axios|fetch"

# Filter API responses
adb logcat -v brief | Select-String "HTTP.*200|HTTP.*400|HTTP.*500"

# Filter JS errors
adb logcat -v brief | Select-String "ReactNativeJS.*Error"
```

---

## 7. Analyze for Feature / A/B Testing

### 7.1 Feature gap analysis

Cross-reference screenshot evidence against the feature checklist:

```markdown
| Feature | Screenshot Evidence | Status | Notes |
|---------|-------------------|--------|-------|
| Login flow works | 01-login.png | ✅ | Demo login works |
| Garden grid visible | 02-garden.png | ✅ | 6×6 empty grid |
| Plant selector opens | 03-plant-selector.png | ✅ | 20+ species |
| Marketplace lists | 04-marketplace.png | ✅ | 3 listings |
| Scanner UI | 05-scanner.png | ⚠️ | Camera permission, may need physical device |
| Community loads | 06-community.png | ✅ | Groups + leaderboard |
| Profile loads | 07-profile.png | ❌ | RSOD — lazy load missing bundle |
```

### 7.2 A/B test scenarios

From screenshot analysis, identify candidates for A/B testing:

| Test | Variant A (Control) | Variant B (Treatment) | Metric |
|------|--------------------|-----------------------|--------|
| Empty garden CTA | Full screen "Your garden is empty" | Subtle "Tap any plot" hint beneath grid | Tap-through rate to plant screen |
| Water button state | Always active blue button | Auto-disables when hydrated ≥ 80% | Water usage rate |
| Harvest readiness | Shows "Harvest" when mature | Shows "🌾 Harvest" + tick countdown when close | Harvest completion rate |
| Walkthrough design | 5-step full overlay | 3-step condensed / inline tooltip | Step completion rate |
| Collection badge position | Top-right of header | Below garden grid | Discovery conversion |

### 7.3 Build A/B test variant

```bash
# 1. Create feature branch
git checkout -b feat/ab-test-garden-cta

# 2. Implement variant B changes
# 3. Wrap in feature flag
# 4. Build two APKs or use remote config toggles
cd packages/mobile/android
gradlew.bat assembleDebug -x :expo-updates:kaptDebugKotlin

# 5. Install both variants on separate emulators
adb -s emulator-5554 install -r variantA.apk
adb -s emulator-5556 install -r variantB.apk

# 6. Run both, capture screenshots, compare
```

---

## 8. Troubleshooting

### APK install fails with INSTALL_FAILED_UPDATE_INCOMPATIBLE

```bash
adb uninstall com.gardenverse.mobile
adb install app-debug.apk
```

### Emulator won't start (GPU error)

Try different GPU modes:
```bash
-gpu host       # Use host GPU (fastest, requires GPU passthrough)
-gpu mesa       # Mesa3D software renderer
-gpu swiftshader_indirect  # SwiftShader (good fallback)
-gpu auto       # Let emulator decide
```

### App crashes on launch (NoSuchMethodError, ClassNotFoundException)

The APK was built for a different architecture or the JS bundle is stale:
```bash
# Rebuild fresh
cd packages/mobile
npx react-native bundle --platform android --dev false --entry-file index.js ^
  --bundle-output android/app/src/main/assets/index.android.bundle ^
  --assets-dest android/app/src/main/res
cd android
gradlew.bat clean assembleDebug -x :expo-updates:kaptDebugKotlin
```

### Tab shows RSOD "Could not connect to development server"

The JS bundle wasn't pre-built. The APK is trying to load lazy chunks from Metro. Fix:
```bash
# Add to build.gradle to skip the bundle step
# android { aaptOptions { noCompress "js" } }
# Then run the bundle command (step 1.1) before assembleDebug
```

### Gradle build fails with "kaptDebugKotlin" SQLite lock error

Windows-specific: Room's DatabaseVerifier creates a lock file system property in a forked worker. The `java.io.tmpdir` defaults to `C:\WINDOWS\` which isn't writable. Workaround:
```bash
gradlew.bat assembleDebug -x :expo-updates:kaptDebugKotlin -x :expo-updates:compileDebugKotlin
```
