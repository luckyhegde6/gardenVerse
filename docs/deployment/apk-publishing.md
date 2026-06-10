# APK Build & Publish Guide

**Platform:** Android (Google Play Store)
**Build System:** Gradle (React Native) + EAS Build
**Package:** `com.gardenverse.app`

---

## Build Variants

| Variant | Command | Output | Distribution |
|---------|---------|--------|-------------|
| Debug APK | `gradlew assembleDebug` | `app-debug.apk` | Internal testing |
| Release APK | `gradlew assembleRelease` | `app-release.apk` | Manual distribution |
| Release AAB | `gradlew bundleRelease` | `app-release.aab` | Google Play Store |
| EAS Build | `eas build --platform all` | Managed by EAS | EAS Submit → Play Store |

---

## Option 1: Local Gradle Build (Debug Testing)

### Prerequisites

1. **Android SDK** — `ANDROID_HOME=C:\Users\lucky\AppData\Local\Android\Sdk`
2. **Java JDK 17** — Required by React Native 0.74
3. **Gradle** — Bundled with Android project (`gradlew`)
4. **Signing keystore** — For release builds

### Directory Structure

```
packages/mobile/android/
├── app/
│   ├── build.gradle          # App-level Gradle config
│   ├── src/main/
│   │   ├── AndroidManifest.xml
│   │   └── java/com/gardenverse/app/
│   └── build/
│       └── outputs/apk/
│           ├── debug/app-debug.apk
│           └── release/app-release.apk
├── build.gradle              # Project-level Gradle config
├── gradle.properties
├── gradlew                   # Gradle wrapper (Unix)
└── gradlew.bat               # Gradle wrapper (Windows)
```

### Build Debug APK

```bash
cd packages/mobile/android

# Build debug APK
.\gradlew assembleDebug

# Output: android/app/build/outputs/apk/debug/app-debug.apk
# Size: ~80-120 MB
```

### Install on Emulator/Device

```bash
# Install on emulator
adb install android/app/build/outputs/apk/debug/app-debug.apk

# Install on connected device
adb -d install android/app/build/outputs/apk/debug/app-debug.apk

# Reinstall (force)
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

### Build Release APK (Local)

> ⚠️ Requires signing configuration in `android/app/build.gradle`

```bash
cd packages/mobile/android

# Generate signed release APK
.\gradlew assembleRelease

# Output: android/app/build/outputs/apk/release/app-release.apk
# Size: ~40-60 MB (minified + signed)
```

### Build Release AAB (Play Store Upload)

```bash
cd packages/mobile/android

# Generate signed App Bundle (required for Play Store)
.\gradlew bundleRelease

# Output: android/app/build/outputs/bundle/release/app-release.aab
```

---

## Option 2: EAS Build (Recommended for Publishing)

EAS Build is Expo's cloud build service. No local SDK/Java needed.

### Prerequisites

1. **EAS CLI** — `npm i -g eas-cli`
2. **Expo account** — [expo.dev](https://expo.dev)
3. **Google Play developer account** — [play.google.com/console](https://play.google.com/console) ($25 one-time fee)

### Login

```bash
eas login
# Follow browser prompt
```

### Configure EAS

**`eas.json`** (already configured):

```json
{
  "cli": { "version": ">= 20.0.0", "appVersionSource": "remote" },
  "build": {
    "development": { "developmentClient": true, "distribution": "internal" },
    "preview": { "distribution": "internal" },
    "production": { "autoIncrement": true }
  },
  "submit": { "production": {} }
}
```

### EAS Build Commands

```bash
# Internal testing build (debug)
eas build --platform android --profile development

# Preview build (release APK for internal testing)
eas build --platform android --profile preview

# Production build (AAB for Play Store)
eas build --platform android --profile production

# Check build status
eas build:list

# View build logs
eas build:view <build-id>
```

### EAS Submit to Play Store

```bash
# Submit latest production build to Google Play
eas submit --platform android --profile production

# Submit specific build
eas submit --platform android --id <build-id>
```

---

## Signing Configuration

### Generate Upload Keystore

```bash
# Generate new keystore (DO NOT LOSE THIS FILE)
keytool -genkeypair -v \
  -storetype PKCS12 \
  -keystore gardenverse-upload.keystore \
  -alias gardenverse-key \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# You will be prompted for:
# - Keystore password (save securely!)
# - Key password (save securely!)
# - Identifying information (CN, O, etc.)
```

### Configure Gradle Signing

**`android/gradle.properties`:**

```properties
GARDENVERSE_UPLOAD_STORE_FILE=gardenverse-upload.keystore
GARDENVERSE_UPLOAD_KEY_ALIAS=gardenverse-key
GARDENVERSE_UPLOAD_STORE_PASSWORD=*****
GARDENVERSE_UPLOAD_KEY_PASSWORD=*****
```

**`android/app/build.gradle`:**

```groovy
android {
    signingConfigs {
        release {
            if (project.hasProperty('GARDENVERSE_UPLOAD_STORE_FILE')) {
                storeFile file(GARDENVERSE_UPLOAD_STORE_FILE)
                storePassword GARDENVERSE_UPLOAD_STORE_PASSWORD
                keyAlias GARDENVERSE_UPLOAD_KEY_ALIAS
                keyPassword GARDENVERSE_UPLOAD_KEY_PASSWORD
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

> ⚠️ **CRITICAL:** Never commit the keystore file or passwords to git. Use environment variables or a secrets manager.

### EAS Signing (Managed by Expo)

If using EAS Build, you can let Expo manage your signing credentials:

```bash
# Generate and store keystore on EAS servers
eas credentials
# Select: Android → Production → Create new → Upload to EAS
```

---

## Google Play Console Setup

### 1. Create App

1. Go to [Play Console](https://play.google.com/console)
2. Click **Create app**
3. Fill in:
   - App name: `GardenVerse`
   - Default language: English
   - App type: Application
   - Free/Paid: Free

### 2. Store Listing

- **Short description** (80 chars): "Grow your virtual garden with AI-powered plant care"
- **Full description** (4000 chars): Detailed feature list
- **App icon:** 512x512 PNG
- **Feature graphic:** 1024x500 PNG
- **Screenshots:** Phone (min 2), Tablet (optional)
- **Category:** Lifestyle / Simulation
- **Tags:** gardening, farming, simulation, agriculture

### 3. Content Rating

1. Go to **App content** → **Content rating**
2. Complete the questionnaire
3. Submit for rating

### 4. Target Audience & Content

1. Go to **App content** → **Target audience and content**
2. Select age groups (e.g., "Target age 13+")
3. Complete all sections

### 5. Privacy Policy

1. Host a privacy policy page (e.g., `https://gardenverse.app/privacy`)
2. Enter the URL in **App content** → **Privacy policy**

### 6. Data Safety

1. Go to **App content** → **Data safety**
2. Declare all data collection:
   - Email address (account creation)
   - Location (weather features, geohash only — never exact)
   - Photos (plant scanning via camera)
   - Device identifiers (push notifications)

### 7. App Signing

Play Console uses **Play App Signing** — Google manages the actual signing key. The keystore you generate is the "upload key."

---

## Environment Configuration for Production

**`packages/mobile/app.config.js`** — Already configured:

```javascript
extra: {
  apiUrl: process.env.API_URL || 
    (IS_DEV ? 'http://localhost:3000/api/v1' : 'https://gardenverse.vercel.app/api/v1'),
  wsUrl: process.env.WS_URL || 
    (IS_DEV ? 'ws://localhost:3001' : 'wss://ws.gardenverse.app'),
  eas: {
    projectId: process.env.EAS_PROJECT_ID || '5c01de7d-484e-4704-b4a1-d5833b59d62c',
  },
},
```

### Production Environment Variables

Set in EAS Dashboard → Project → Secrets:

```
API_URL=https://gardenverse.vercel.app/api/v1
WS_URL=wss://ws.gardenverse.app
GOOGLE_MAPS_API_KEY=your-production-maps-key
```

### Build with Environment Variables

```bash
# Set env for EAS build
eas build --platform android --profile production
# EAS reads from eas.json and Dashboard secrets automatically
```

---

## Version Management

**`package.json` — Version:**

```json
{
  "version": "1.0.0"
}
```

**Auto-increment with EAS:**

```json
// eas.json
{
  "build": {
    "production": {
      "autoIncrement": true  // Auto-increments buildNumber on each build
    }
  }
}
```

**Manual version bump:**

```bash
# Update package.json version
npm version patch   # 1.0.0 → 1.0.1
npm version minor   # 1.0.0 → 1.1.0
npm version major   # 1.0.0 → 2.0.0
```

---

## Release Process

### Internal Testing Track

```bash
# 1. Build internal build
eas build --platform android --profile preview

# 2. Download APK from EAS
eas build:view

# 3. Upload to Play Console → Internal sharing
#    Or share the APK directly with testers
```

### Closed Testing Track

```bash
# 1. Build production AAB
eas build --platform android --profile production

# 2. Submit to closed testing
eas submit --platform android --profile production

# 3. In Play Console:
#    Testing → Closed testing → Create new track
#    Add testers (email list or Google Group)
#    Rollout to the closed track
```

### Production Track

```bash
# 1. Build production AAB
eas build --platform android --profile production

# 2. Submit to production
eas submit --platform android --profile production

# 3. In Play Console:
#    Production → Releases → Create new release
#    Review all sections (store listing, content rating, etc.)
#    Start rollout (staged: 1% → 10% → 50% → 100%)
```

---

## Staged Rollout

Recommended rollout schedule:

| Stage | Percentage | Duration | Purpose |
|-------|-----------|----------|---------|
| 1% | 1% | 24-48h | Catch critical crashes |
| 10% | 10% | 3-5 days | Monitor crash rate |
| 50% | 50% | 5-7 days | Validate stability |
| 100% | 100% | — | Full rollout |

**Abort:** At any stage, if crash rate > 1%, halt rollout and investigate.

---

## Troubleshooting Builds

| Error | Cause | Fix |
|-------|-------|-----|
| `SDK location not found` | `ANDROID_HOME` not set | `set ANDROID_HOME=C:\Users\lucky\AppData\Local\Android\Sdk` |
| `JAVA_HOME not set` | Java not installed | JDK 17: `set JAVA_HOME=C:\Program Files\Java\jdk-17` |
| `Could not resolve dependencies` | Network/proxy issue | Check internet; delete `~/.gradle/caches` |
| `Duplicate class found` | Conflicting native modules | Check for duplicate packages in `package.json` |
| `Task :app:assembleDebug FAILED` | Build error | Run `--stacktrace` for details |
| EAS build timeout | Large dependencies | Reduce `node_modules`; use `.easignore` |
| `SigningConfig not found` | Missing keystore config | Configure signing (see above) |
| App crashes on launch | Missing env vars | Ensure `API_URL` is set in EAS secrets |
| Camera/missing permissions | Manifest not configured | Check `app.config.js` permissions |

---

## Build Time Estimates

| Build Type | Local Gradle | EAS Build |
|-----------|-------------|-----------|
| Debug APK | 8-15 min | 10-20 min |
| Release APK | 15-25 min | 15-25 min |
| Release AAB | 15-25 min | 15-25 min |

> Local first build is slowest (downloads SDK, dependencies). Subsequent builds are 2-5 min with Gradle cache.

---

## Publishing Checklist

- [ ] App version incremented in `package.json`
- [ ] `app.config.js` API_URL points to production
- [ ] EAS secrets configured (API_URL, GOOGLE_MAPS_API_KEY)
- [ ] Privacy policy URL set
- [ ] Data safety section complete
- [ ] Content rating questionnaire submitted
- [ ] Store listing complete (screenshots, description, icon)
- [ ] App signing key backed up securely
- [ ] Build succeeds: `eas build --platform android --profile production`
- [ ] APK/AAB tested on physical device first
- [ ] Crash-free rate > 99.9% on internal testing
- [ ] Staged rollout started (1% → full)
