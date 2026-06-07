# Android Emulator E2E Testing Guide

**Framework:** Detox 20.51.3
**Emulator:** Pixel 7 API 34 (Android 14)
**Test Runner:** Jest Circus
**Platform:** React Native (Expo)

---

## Overview

The mobile E2E test suite uses [Detox](https://github.com/wix/Detox) to automate the React Native app running on an Android emulator. Tests interact with the app through `testID` props, simulating real user gestures (tap, scroll, type).

```
┌──────────────────────────────────────────────────────┐
│                  Test Execution Flow                  │
│                                                      │
│  PowerShell Script                                   │
│       │                                              │
│       ▼                                              │
│  ┌─────────────┐    ┌──────────────┐                │
│  │ Check AVD   │───▶│ Start Emu    │                │
│  │ Running?    │    │ (if needed)  │                │
│  └─────────────┘    └──────┬───────┘                │
│                            │                         │
│                            ▼                         │
│  ┌─────────────┐    ┌──────────────┐                │
│  │ Build APK   │───▶│ Install APK  │                │
│  │ (optional)  │    │ via adb      │                │
│  └─────────────┘    └──────┬───────┘                │
│                            │                         │
│                            ▼                         │
│  ┌─────────────┐    ┌──────────────┐                │
│  │ Detox test  │───▶│ Jest Circus  │                │
│  │             │    │ runs tests   │                │
│  └─────────────┘    └──────┬───────┘                │
│                            │                         │
│                            ▼                         │
│  ┌─────────────┐    ┌──────────────┐                │
│  │ Screenshot  │───▶│ Test Report  │                │
│  │ capture     │    │ + logs       │                │
│  └─────────────┘    └──────────────┘                │
└──────────────────────────────────────────────────────┘
```

---

## Prerequisites

### 1. Android SDK & Emulator

**Install via Android Studio:**
1. Open Android Studio → SDK Manager (⚙️ → SDK Manager)
2. **SDK Platforms tab:** Check `Android 14.0 ("UpsideDownCake")` (API 34)
3. **SDK Tools tab:** Check `Android SDK Build-Tools`, `Android SDK Platform-Tools`, `Android Emulator`
4. Apply → Install

**Verify:**
```bash
# Check adb
adb version
# Expected: Android Debug Bridge version 1.0.41

# Check emulator binary
emulator -list-avds
# Expected: Pixel_7_API_34
```

### 2. Create AVD (if not exists)

```bash
# Create virtual device via command line
avdmanager create avd \
  --name Pixel_7_API_34 \
  --device "pixel_7" \
  --package "system-images;android-34;google_apis;x86_64" \
  --tag "google_apis"

# Or use Android Studio:
# Tools → Device Manager → Create Device → Pixel 7 → API 34 (Android 14)
```

### 3. Verify AVD Boots

```bash
# Start emulator manually
emulator -avd Pixel_7_API_34 -no-snapshot-load

# Wait for boot (30-60 seconds)
adb wait-for-device

# Verify
adb devices
# Expected: emulator-5554   device
```

### 4. Environment Setup

```bash
# Required environment variables
set ANDROID_HOME=C:\Users\lucky\AppData\Local\Android\Sdk
set ANDROID_SDK_ROOT=C:\Users\lucky\AppData\Local\Android\Sdk
set PATH=%PATH%;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\emulator
```

---

## Test Configuration

### `.detoxrc.js` — Detox Config

```javascript
module.exports = {
  testRunner: {
    args: { '$0': 'jest', config: 'e2e/jest.config.js' },
    jest: { setupTimeout: 120000 }
  },
  apps: {
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      build: 'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug',
      reversePorts: [8081]
    }
  },
  devices: {
    emulator: {
      type: 'android.emulator',
      device: { avdName: 'Pixel_7_API_34' }
    }
  },
  configurations: {
    'android.emu.debug': {
      device: 'emulator',
      app: 'android.debug'
    }
  }
};
```

### `e2e/mobile/jest.config.js` — Test Runner

```javascript
module.exports = {
  rootDir: '.',
  testRunner: 'jest-circus',
  testMatch: ['**/*.test.ts'],
  testTimeout: 120000,     // 2 min per test (emulator is slow)
  maxWorkers: 1,           // Sequential (single emulator)
  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  reporters: ['detox/runners/jest/reporter'],
  testEnvironment: 'detox/runners/jest/testEnvironment',
  verbose: true,
};
```

> **Key settings:**
> - `maxWorkers: 1` — Only one emulator, tests must run sequentially
> - `testTimeout: 120000` — 2 minutes per test (emulator interaction is slow)
> - `globalSetup/globalTeardown` — Detox manages app install/launch/terminate

---

## Test Files

| File | Tests | What It Validates |
|------|-------|-------------------|
| `e2e/mobile/gardenverse.e2e.test.ts` | 1 flow | Full app: login → all tabs → logout |
| `e2e/mobile/auth.test.ts` | 4 tests | Login form, demo login, admin login, wrong password, session |
| `e2e/mobile/garden.test.ts` | 8 tests | Crop display, 2D/3D toggle, water/fertilize/harvest, walkthrough |
| `e2e/mobile/marketplace.test.ts` | 7 tests | Browse listings, detail view, create form |
| `e2e/mobile/navigation.test.ts` | 8 tests | Tab bar, all tabs, profile stats |
| `e2e/mobile/helpers.ts` | — | 25+ reusable utilities |

### Total: ~38 test cases across 5 test suites

### Helper Utilities (`e2e/mobile/helpers.ts`)

```typescript
// Core interactions
waitForElement(id, timeout?)     // Wait for testID to appear
tap(id)                          // Single tap on element
doubleTap(id)                    // Double tap
typeText(id, text)               // Type into text input
swipeLeft(id) / swipeRight(id)   // Horizontal swipe
scrollDown(id?) / scrollUp(id?)  // Vertical scroll
goBack()                         // Back button navigation

// Assertions
assertExists(id)                 // Element exists in tree
assertVisible(id)                // Element is visible on screen
assertTextContains(id, text)     // Text content check
elementExists(id) → boolean      // Non-throwing check (for skips)
getText(id) → string             // Read text content

// Navigation
navigateToTab(tabId)             // Tap bottom tab

// Auth
login(email, password)           // Full login flow via API
logout()                         // Logout

// Utilities
wait(ms)                         // Pause execution
screenshot(name)                 // Capture screenshot
relaunchApp()                    // Force restart
waitForLoadingDone()             // Wait for loading spinners
waitForElementToGone(id)         // Wait for element to disappear

// API
API_URL = 'http://10.0.2.2:3000' // Emulator → host localhost
```

### Demo Credentials (used in tests)

```typescript
DEMO_USER      = { email: 'demo@gardenverse.vercel.app',      password: 'password123' }
ADMIN_USER     = { email: 'admin@gardenverse.vercel.app',     password: 'password123' }
SUPERADMIN_USER = { email: 'superadmin@gardenverse.vercel.app', password: 'password123' }
```

---

## Networking: Emulator → Host

The Android emulator uses special IP `10.0.2.2` to reach the host machine's `localhost`.

```
Emulator                    Host Machine
┌────────────┐             ┌──────────────────┐
│ RN App     │  10.0.2.2   │ Next.js API      │
│            │────────────▶│ localhost:3000   │
│ Detox      │             │                  │
│            │◀────────────│ /api/v1/*       │
└────────────┘             └──────────────────┘
```

**Prerequisites for API tests:**
1. Admin API must be running on `localhost:3000`
2. Database must be seeded with demo data
3. The app must be configured with `API_URL=http://10.0.2.2:3000` (automatic in dev mode)

---

## Running Tests

### Quick Start (Daemon Running)

```bash
# Ensure emulator is running
adb devices
# → emulator-5554   device

# Ensure API is running
curl http://localhost:3000/api/v1/health
# → { "status": "ok" }

# Ensure APK is built
# (see Troubleshooting if not)

# Run all mobile E2E tests
npm run test:e2e:mobile
```

### Full Pipeline (Build + Test)

```bash
# Build debug APK, install on emulator, run all tests
npm run test:e2e:mobile:build
```

### Run Specific Test File

```bash
# Run only auth tests
npx detox test --configuration android.emu.debug \
  --testNamePattern "auth\.test"

# Run only garden tests
npx detox test --configuration android.emu.debug \
  --testNamePattern "garden\.test"
```

### Run Specific Test Case

```bash
npx detox test --configuration android.emu.debug \
  --testNamePattern "should login with demo account"
```

### Verbose Mode

```bash
npx detox test --configuration android.emu.debug --loglevel verbose
```

### Using PowerShell Runner

```powershell
# Run tests (checks emulator + API automatically)
powershell -ExecutionPolicy Bypass -File e2e/mobile/run-mobile-e2e.ps1

# Build APK + run tests
powershell -ExecutionPolicy Bypass -File e2e/mobile/run-mobile-e2e.ps1 -Build

# With test filter
powershell -ExecutionPolicy Bypass -File e2e/mobile/run-mobile-e2e.ps1 -TestFilter "auth"
```

### Test Logs

Logs are saved to: `e2e/logs/mobile-e2e-<timestamp>.log`

```powershell
# View latest log
Get-ChildItem e2e/logs/mobile-e2e-*.log | Sort-Object LastWriteTime -Descending | Select-Object -First 1 | Get-Content
```

---

## Manual Emulator Test Run

Without Detox, you can manually test the app on the emulator:

```bash
# 1. Start Metro bundler (in one terminal)
cd packages/mobile && npx expo start

# 2. Start emulator (in another terminal)
emulator -avd Pixel_7_API_34

# 3. Install the app
adb install -r packages/mobile/android/app/build/outputs/apk/debug/app-debug.apk

# 4. Open the app
adb shell am start -n com.gardenverse.app/.MainActivity

# 5. Reload JS bundle (if needed)
adb shell input text "RR"    # Shake gesture alternative

# 6. View logs
adb logcat | findstr "ReactNativeJS"

# 7. Screenshot
adb shell screencap /sdcard/screen.png
adb pull /sdcard/screen.png
```

---

## testID Requirements

Detox finds elements by their `testID` prop. The app must have `testID` set on interactive elements:

```tsx
// Required testIDs for E2E tests

// Navigation
<TabBar testID="bottom-tab-bar" />
<TabButton testID="tab-garden" />
<TabButton testID="tab-marketplace" />
<TabButton testID="tab-community" />
<TabButton testID="tab-scanner" />
<TabButton testID="tab-profile" />

// Auth
<TextInput testID="email-input" />
<TextInput testID="password-input" />
<Button testID="login-button" testID="submit-login" />

// Garden
<View testID="garden-screen" />
<View testID="garden-grid" />
<TouchableOpacity testID="crop-item-0" />
<View testID="growth-overlay" />
<Button testID="harvest-button" />
<Button testID="water-button" />
<Button testID="fertilize-button" />

// Marketplace
<View testID="marketplace-screen" />
<View testID="marketplace-listing-list" />
<TouchableOpacity testID="marketplace-listing-0" />
<View testID="listing-detail-screen" />
<Button testID="create-listing-button" />

// Profile
<View testID="profile-screen" />
<View testID="profile-stats" />
<Text testID="profile-level" />
```

> ⚠️ If tests fail with "element not found", the app may be missing the required `testID` props.

---

## Troubleshooting

### Emulator Won't Start

```bash
# Check AVD exists
emulator -list-avds

# Check available AVDs
avdmanager list avd

# Wipe emulator data (last resort)
emulator -avd Pixel_7_API_34 -wipe-data

# Check for HAXM/Hypervisor
# Windows: Enable "Windows Hypervisor Platform" in Windows Features
# BIOS: Enable VT-x (Intel) or AMD-V (AMD)
```

### APK Not Built

```bash
# Build manually
cd packages/mobile/android
.\gradlew assembleDebug
# Output: android/app/build/outputs/apk/debug/app-debug.apk

# Check if file exists
dir android\app\build\outputs\apk\debug\app-debug.apk
```

### Detox Can't Find Emulator

```bash
# Verify adb connection
adb devices

# Kill and restart adb server
adb kill-server
adb start-server
adb devices

# Check emulator API level
adb shell getprop ro.build.version.sdk
# Expected: 34
```

### App Crashes on Launch

```bash
# Check React Native logs
adb logcat | findstr "ReactNativeJS"

# Check for missing env vars
# The app needs API_URL pointing to a running backend
# Dev: http://10.0.2.2:3000
# Verify: adb shell curl http://10.0.2.2:3000/api/v1/health
```

### Tests Time Out

```bash
# Increase timeout in jest.config.js (default: 120000)
testTimeout: 180000

# Or run with --testTimeout flag
npx detox test --configuration android.emu.debug --testTimeout 180000
```

### Metro Bundler Not Found (conn fail)

Detox uses `reversePorts: [8081]` so the emulator can reach Metro on `localhost:8081`. If this fails:

```bash
# Reverse the port manually
adb reverse tcp:8081 tcp:8081

# Verify
adb reverse --list
```

### "Element Not Found" Errors

1. The element may not exist yet — increase wait timeout
2. May be on a different screen — check navigation flow
3. testID may not be set in the component:
   ```bash
   # Search for testID in source
   grep -r "testID=" packages/mobile/src/
   ```
4. Could be a timing issue — add `waitForElement()` before assertion

### Flaky Tests

- Emulator is inherently slower than physical device
- Increase timeouts for UI-heavy screens
- Use `waitForElement()` before assertions
- Avoid hard `wait()` calls — prefer `waitForElement()`

### Screen Recording

```bash
# Record during test run
adb shell screenrecord /sdcard/test.mp4
# Ctrl+C to stop
adb pull /sdcard/test.png
```

### Emulator Performance Tips

1. **Use x86_64 system image** (not ARM) — much faster on Intel/AMD
2. **Enable hardware acceleration:**
   - Windows: Turn on "Windows Hypervisor Platform"
   - BIOS: Enable VT-x / AMD-V
3. **Allocate sufficient RAM:** 4096 MB in AVD settings
4. **Reduce emulator resolution:** 1080x1920 instead of 1440+
5. **Disable snapshots** for clean tests: `-no-snapshot-load`
6. **Use cold boot only for first test**, subsequent tests reuse running emulator

---

## CI/CD Integration

For CI environments (GitHub Actions, etc.):

```yaml
# Example: GitHub Actions
- name: Start emulator
  uses: reactivecircus/android-emulator-runner@v2
  with:
    api-level: 34
    arch: x86_64
    script: |
      cd packages/mobile/android
      ./gradlew assembleDebug
      npx detox test --configuration android.emu.debug
```

---

## Quick Reference

```bash
# Full flow
npm run test:e2e:mobile:build

# Test only (skip build)
npm run test:e2e:mobile

# Specific test
npx detox test --configuration android.emu.debug --testNamePattern "garden"

# Check emulator status
adb devices

# Build APK only
cd packages/mobile/android && .\gradlew assembleDebug

# View test logs
e2e/logs/mobile-e2e-*.log
```
