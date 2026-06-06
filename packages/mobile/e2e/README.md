# Mobile E2E Testing with Detox

## Prerequisites

### Android (Recommended for Windows)
1. **Android Studio** — Install from https://developer.android.com/studio
2. **Android SDK** — Installed via Android Studio SDK Manager
   - Android SDK Platform 34 (or latest)
   - Android SDK Build-Tools
   - Android SDK Command-line Tools
   - Android Emulator
3. **Java JDK 17** — Required by Gradle
4. **Environment Variables:**
   ```powershell
   # Add to System Environment Variables
   ANDROID_HOME = C:\Users\<you>\AppData\Local\Android\Sdk
   JAVA_HOME = C:\Program Files\Java\jdk-17
   ```
   Add to PATH:
   ```
   %ANDROID_HOME%\platform-tools
   %ANDROID_HOME%\tools
   ```

### iOS (macOS only)
1. **Xcode 15+** — From Mac App Store
2. **CocoaPods** — `sudo gem install cocoapods`
3. **Apple Developer Account** — For code signing (can use free tier)

## Setup

```bash
# From packages/mobile/
npm install

# Verify Detox CLI
npx detox --version

# Create Android emulator (if not exists)
# Open Android Studio → Tools → Device Manager → Create Virtual Device
# Select: Pixel 7, API 34, x86_64
# Name it: Pixel_7_API_34

# Verify emulator exists
emulator -list-avds
```

## Running Tests

### Android Emulator
```bash
# 1. Start the backend API (in separate terminal from root)
npm run admin:dev

# 2. Start emulator
emulator -avd Pixel_7_API_34

# 3. Build the app for Detox
npm run e2e:build:android

# 4. Run all E2E tests
npm run e2e:test:android

# Or run a specific test file
npx detox test e2e/auth.test.ts --configuration android.emu.debug

# Or build + test in one command
npm run e2e:android
```

### iOS Simulator (macOS only)
```bash
# 1. Start backend
npm run admin:dev

# 2. Build for iOS
npm run e2e:build:ios

# 3. Run tests
npm run e2e:test:ios

# Or combined
npm run e2e:ios
```

## Test Files

| File | Tests | Description |
|------|-------|-------------|
| `e2e/auth.test.ts` | 6 | Login, validation, wrong credentials, persistence |
| `e2e/garden.test.ts` | 7 | Tab navigation, garden content, all tabs |
| `e2e/marketplace.test.ts` | 3 | Marketplace display, content, navigation |
| `e2e/community.test.ts` | 4 | Community display, content, tab switching |
| `e2e/profile.test.ts` | 4 | Profile display, content, navigation |
| `e2e/scanner.test.ts` | 3 | Scanner display, content, navigation |

**Total: 27 test cases across 6 test suites**

## Configuration

### `.detoxrc.js`
- **Android debug**: `android.emu.debug` — builds debug APK, runs on emulator
- **Android release**: `android.emu.release` — builds release APK
- **iOS debug**: `ios.sim.debug` — builds debug app, runs on simulator
- **iOS release**: `ios.sim.release` — builds release app

### Port Forwarding
The Android config includes `reversePorts: [3000]` which maps the device's `localhost:3000` to your machine's `localhost:3000` (the backend API).

For iOS, you may need to manually set the API URL to your machine's IP address in `src/services/api.ts`:
```typescript
const BASE_URL = __DEV__
  ? "http://<YOUR_MACHINE_IP>:3000/api/v1"  // Use LAN IP for iOS simulator
  : "https://gardenverse.vercel.app/api/v1";
```

## Debugging

### View Detox Logs
```bash
npx detox test --configuration android.emu.debug --loglevel trace
```

### Debug Failures
- Screenshots are saved on failure in `artifacts/`
- Use `--debug-synchronization` to see what Detox is waiting for

### Common Issues

| Issue | Solution |
|-------|----------|
| `Cannot find emulator` | Start emulator manually first, or check AVD name in `.detoxrc.js` |
| `Build failed` | Run `cd android && ./gradlew clean` then rebuild |
| `API connection refused` | Ensure backend is running on port 3000, check port forwarding |
| `Element not found` | Increase timeout, check testID/accessibilityLabel matches |
| `App not installed` | Rebuild with `npm run e2e:build:android` |

## Adding New Tests

1. Add `testID` props to interactive elements in your screens
2. Create a new file in `e2e/` with `.test.ts` extension
3. Import Detox utilities: `import { by, device, element, expect } from 'detox';`
4. Use `device.launchApp()` in `beforeAll`
5. Use `device.reloadReactNative()` in `beforeEach` for clean state

### Example Test
```typescript
import { by, device, element, expect as detoxExpect } from 'detox';

describe('My Feature', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  it('should do something', async () => {
    await element(by.id('my-button')).tap();
    await detoxExpect(element(by.text('Result'))).toBeVisible();
  });
});
```
