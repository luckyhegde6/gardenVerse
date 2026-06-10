# Mobile Build & E2E Testing Plan

## Overview
End-to-end build pipeline for the GardenVerse React Native mobile app, covering Android APK generation, emulator management, and Detox E2E testing.

## Phase 1: Environment Setup
- [ ] Verify JDK 17 at `C:\jdk17\jdk-17.0.12\`
- [ ] Verify Android SDK at `C:\Users\lucky\AppData\Local\Android\Sdk\`
- [ ] Verify Build Tools 36.1.0 and Platform android-36.1 installed
- [ ] Set JAVA_HOME and ANDROID_HOME environment variables per-session

## Phase 2: APK Build
- [ ] Run `npx expo prebuild --platform android --clean` to generate native project
- [ ] Run `gradlew.bat assembleDebug assembleAndroidTest -DtestBuildType=debug`
- [ ] Verify APK at `packages/mobile/android/app/build/outputs/apk/debug/app-debug.apk`
- [ ] Install APK on emulator: `adb install -r <apk-path>`

## Phase 3: Emulator Setup
- [ ] Start emulator: `emulator -avd Pixel_7_API_34 -no-window -no-audio -gpu swiftshader_indirect`
- [ ] Wait for boot: `adb shell getprop sys.boot_completed` returns `1`
- [ ] Forward API port: `adb reverse tcp:3000 tcp:3000`
- [ ] Verify backend accessible from emulator: `curl http://localhost:3000/api/v1/health`

## Phase 4: E2E Testing
- [ ] Build Detox test APK: `npx detox build --configuration android.emu.debug`
- [ ] Run full test suite: `npx detox test --configuration android.emu.debug --cleanup`
- [ ] Verify all 27 tests pass across 6 suites
- [ ] Review test results and fix any failures

### Test Suites
1. **auth.test.ts** (6 tests) — Login, validation, demo accounts, logout, token persistence
2. **garden.test.ts** (7 tests) — Garden view, plant selection, crop details, watering, growth engine
3. **marketplace.test.ts** (3 tests) — Browse, detail, create listing
4. **community.test.ts** (4 tests) — Groups, chat, nearby, group detail
5. **profile.test.ts** (4 tests) — Profile view, stats, settings, collections
6. **scanner.test.ts** (3 tests) — Camera permissions, scanner interface, scan history

## Phase 5: Artifacts & Reporting
- [ ] APK artifacts collected from build output
- [ ] Test results logged to `playwright-report/` or Detox output
- [ ] Screenshots captured on test failure
- [ ] Build summary documented

## Build Scripts

### Full Build (Batch)
```batch
@echo off
set "JAVA_HOME=C:\jdk17\jdk-17.0.12"
set "ANDROID_HOME=C:\Users\lucky\AppData\Local\Android\Sdk"
set "PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\platform-tools;%PATH%"
cd /d F:\Local_git\gardenVerse\packages\mobile
call npx expo prebuild --platform android --clean
cd android
call gradlew.bat assembleDebug assembleAndroidTest -DtestBuildType=debug
echo BUILD COMPLETE
pause
```

### Incremental Build (Batch)
```batch
@echo off
set "JAVA_HOME=C:\jdk17\jdk-17.0.12"
set "ANDROID_HOME=C:\Users\lucky\AppData\Local\Android\Sdk"
set "PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\platform-tools;%PATH%"
cd /d F:\Local_git\gardenVerse\packages\mobile\android
call gradlew.bat assembleDebug assembleAndroidTest -DtestBuildType=debug
echo BUILD COMPLETE
pause
```

### E2E Test Runner (Batch)
```batch
@echo off
cd /d F:\Local_git\gardenVerse\packages\mobile
call npx detox test --configuration android.emu.debug --cleanup
echo TESTS COMPLETE
pause
```

## Troubleshooting

### Gradle Timeout
First run downloads ~500MB of dependencies. Use 20+ minute timeout.
Gradle caches after first run — subsequent builds are fast.

### JAVA_HOME Not Found
PowerShell's `set` doesn't work for cmd — always use batch scripts for builds.
Set JAVA_HOME in the same cmd session that runs Gradle.

### Stale Java Processes
```batch
taskkill /F /IM java.exe
```
Gradle daemon locks files. Kill all java.exe before re-running build.

### expo prebuild Fails
Delete `android/` folder first:
```batch
rmdir /s /q packages\mobile\android
npx expo prebuild --platform android --clean
```

### Emulator Not Detected
```bash
adb kill-server
adb start-server
adb devices
```

### Tests Timeout
- Verify emulator fully booted: `adb shell getprop sys.boot_completed` → `1`
- Verify backend running: `curl http://localhost:3000/api/v1/health`
- Verify port forwarding: `adb reverse tcp:3000 tcp:3000`

### Auth Tests Fail
- Port forwarding must be active: `adb reverse tcp:3000 tcp:3000`
- Demo account must exist in database
- Backend must be running on localhost:3000

## Key Paths
| Artifact | Path |
|----------|------|
| Mobile app source | `packages/mobile/` |
| Android native | `packages/mobile/android/` |
| Debug APK | `packages/mobile/android/app/build/outputs/apk/debug/app-debug.apk` |
| Test APK | `packages/mobile/android/app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk` |
| Detox config | `packages/mobile/.detoxrc.js` |
| E2E tests | `packages/mobile/e2e/*.test.ts` |
| Expo config | `packages/mobile/app.config.js` |

## Agent Profiles
- **mobile-build** — APK building and Gradle management (`.agents/agents/mobile-build.md`)
- **mobile-e2e** — Detox E2E testing and emulator management (`.agents/agents/mobile-e2e.md`)
