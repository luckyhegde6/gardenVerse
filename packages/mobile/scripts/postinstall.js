/**
 * postinstall.js — Patches npm packages for EAS Build compatibility.
 *
 * Fixes:
 * 1. expo-modules-core (v1.12.26): components.release -> components.findByName("release")
 *    Prevents "Could not get unknown property 'release'" in AGP 8.x
 * 2. expo-updates (v0.25.28): getRNVersion() searches multiple paths for react-native/package.json
 *    Prevents "Process command 'node' finished with non-zero exit value 1" cascade failures
 * 3. react-native-reanimated (v3.9.0): registers WorkletsModule in ReanimatedPackage.java
 *    Prevents "Native part of Reanimated doesn't seem to be initialized (Worklets)"
 *    caused by missing native module registration for the worklets TurboModule
 *
 * This runs automatically after `npm install` / `yarn` via the "postinstall" lifecycle hook.
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');
const LOG_PREFIX = '[postinstall:eas-patches]';

function log(...args) {
  console.log(LOG_PREFIX, ...args);
}

function warn(...args) {
  console.warn(LOG_PREFIX, '[WARN]', ...args);
}

function error(...args) {
  console.error(LOG_PREFIX, '[ERROR]', ...args);
}

// ─────────────────────────────────────────────
// Fix 1: ExpoModulesCorePlugin.gradle
// ─────────────────────────────────────────────

const EXPO_MODULES_CORE_GRADLE = path.join(
  PROJECT_ROOT,
  'node_modules',
  'expo-modules-core',
  'android',
  'ExpoModulesCorePlugin.gradle'
);

function patchExpoModulesCorePlugin() {
  if (!fs.existsSync(EXPO_MODULES_CORE_GRADLE)) {
    warn(`expo-modules-core not found at ${EXPO_MODULES_CORE_GRADLE}, skipping patch`);
    return false;
  }

  let content = fs.readFileSync(EXPO_MODULES_CORE_GRADLE, 'utf8');
  const original = content;

  // Replace the unsafe property access with a safe lookup
  content = content.replace(
    /from components\.release/g,
    'from components.findByName("release")'
  );

  if (content === original) {
    log('ExpoModulesCorePlugin.gradle: already patched (or pattern not found), skipping');
    return false;
  }

  fs.writeFileSync(EXPO_MODULES_CORE_GRADLE, content, 'utf8');
  log('✓ Patched ExpoModulesCorePlugin.gradle: components.release → components.findByName("release")');
  return true;
}

// ─────────────────────────────────────────────
// Fix 2: expo-updates android/build.gradle — getRNVersion()
// ─────────────────────────────────────────────

const EXPO_UPDATES_BUILD_GRADLE = path.join(
  PROJECT_ROOT,
  'node_modules',
  'expo-updates',
  'android',
  'build.gradle'
);

/**
 * The original getRNVersion() hardcodes a single path:
 *   projectDir/../../packages/mobile/node_modules/react-native/package.json
 *
 * This patch makes it search multiple paths (monorepo-hoisted, workspace-local, etc.)
 * so it works in EAS Build and different monorepo layouts.
 */
const PATCHED_GET_RN_VERSION = `def getRNVersion() {
  // Read version directly from the package.json file to avoid node path issues on Windows.
  // react-native may be installed at different locations depending on monorepo setup:
  //   - Hoisted to root: <repoRoot>/node_modules/react-native/package.json
  //   - Workspace-local: <repoRoot>/packages/mobile/node_modules/react-native/package.json
  //   - EAS Build: may differ based on cache/symlink setup
  def repoRoot = projectDir.getParentFile().getParentFile().getParentFile()
  def possiblePaths = [
    // Workspace-local (most common in npm workspaces with isolated installs)
    new File(repoRoot, 'packages/mobile/node_modules/react-native/package.json'),
    // Hoisted to root node_modules
    new File(repoRoot, 'node_modules/react-native/package.json')
  ]
  def packageJson = possiblePaths.find { it.exists() }
  if (packageJson == null) {
    throw new GradleException("Could not find react-native/package.json. Checked: " + possiblePaths.collect { it.getAbsolutePath() }.join(", "))
  }

  def version = packageJson.readLines().find { it.contains('"version"') }.replaceAll(/.*"version"\\s*:\\s*"([^"]+)".*/, '$1')

  def coreVersion = version.split("-")[0]
  def (major, minor, patch) = coreVersion.tokenize('.').collect { it.toInteger() }

  return versionToNumber(
    major,
    minor,
    patch
  )
}`;

function patchExpoUpdatesBuildGradle() {
  if (!fs.existsSync(EXPO_UPDATES_BUILD_GRADLE)) {
    warn(`expo-updates not found at ${EXPO_UPDATES_BUILD_GRADLE}, skipping patch`);
    return false;
  }

  let content = fs.readFileSync(EXPO_UPDATES_BUILD_GRADLE, 'utf8');
  const original = content;

  // Match the entire getRNVersion() function (from 'def getRNVersion() {' to the closing '}')
  const originalGetRNVersionRegex = /def getRNVersion\(\) \{[\s\S]*?^}/m;

  if (!originalGetRNVersionRegex.test(content)) {
    warn('Expo-updates build.gradle: could not find getRNVersion() function, skipping');
    return false;
  }

  content = content.replace(originalGetRNVersionRegex, PATCHED_GET_RN_VERSION);

  if (content === original) {
    warn('Expo-updates build.gradle: replacement did not change anything, skipping');
    return false;
  }

  fs.writeFileSync(EXPO_UPDATES_BUILD_GRADLE, content, 'utf8');
  log('✓ Patched expo-updates build.gradle: getRNVersion() now searches multiple paths for react-native/package.json');
  return true;
}

// ─────────────────────────────────────────────
// Fix 3: react-native-reanimated — register WorkletsModule
// ─────────────────────────────────────────────

const REANIMATED_PACKAGE = path.join(
  PROJECT_ROOT,
  'node_modules',
  'react-native-reanimated',
  'android',
  'src',
  'main',
  'java',
  'com',
  'swmansion',
  'reanimated',
  'ReanimatedPackage.java'
);

function patchReanimatedPackage() {
  if (!fs.existsSync(REANIMATED_PACKAGE)) {
    warn(`ReanimatedPackage.java not found at ${REANIMATED_PACKAGE}, skipping patch`);
    return false;
  }

  let content = fs.readFileSync(REANIMATED_PACKAGE, 'utf8');

  // Skip if already patched (check for singleton field, which is the latest fix)
  if (content.includes('mReanimatedModule')) {
    log('ReanimatedPackage.java: already patched (singleton), skipping');
    return false;
  }

  const original = content;

  // Patch 1: Add singleton ReanimatedModule field + shared getModule for both names
  content = content.replace(
    'public class ReanimatedPackage extends TurboReactPackage implements ReactPackage {\n\n  @Override\n  public NativeModule getModule(String name, ReactApplicationContext reactContext) {',
    'public class ReanimatedPackage extends TurboReactPackage implements ReactPackage {\n\n  private ReanimatedModule mReanimatedModule;\n\n  @Override\n  public NativeModule getModule(String name, ReactApplicationContext reactContext) {\n    if (name.equals(ReanimatedModule.NAME) || name.equals("WorkletsModule")) {\n      if (mReanimatedModule == null) {\n        mReanimatedModule = new ReanimatedModule(reactContext);\n      }\n      return mReanimatedModule;\n    }'
  );

  // Patch 2: Remove old separate "WorkletsModule" branch (now handled in Patch 1)
  content = content.replace(
    '    if (name.equals("WorkletsModule")) {\n      return new ReanimatedModule(reactContext);\n    }\n    ',
    ''
  );

  // Patch 3: Add WorkletsModule entry in getReactModuleInfoProvider() before return
  content = content.replace(
    '    return new ReactModuleInfoProvider() {',
    '    ReactModule reanimatedAnnotation =\n        ReanimatedModule.class.getAnnotation(ReactModule.class);\n    reactModuleInfoMap.put(\n        "WorkletsModule",\n        new ReactModuleInfo(\n            "WorkletsModule",\n            ReanimatedModule.class.getName(),\n            true,\n            reanimatedAnnotation.needsEagerInit(),\n            reanimatedAnnotation.hasConstants(),\n            reanimatedAnnotation.isCxxModule(),\n            BuildConfig.IS_NEW_ARCHITECTURE_ENABLED));\n\n    return new ReactModuleInfoProvider() {'
  );

  if (content === original) {
    warn('ReanimatedPackage.java: replacement patterns not found, skipping');
    return false;
  }

  fs.writeFileSync(REANIMATED_PACKAGE, content, 'utf8');
  log('✓ Patched ReanimatedPackage.java: WorkletsModule + ReanimatedModule share singleton ReanimatedModule instance');
  return true;
}

// ─────────────────────────────────────────────
// Fix 4: react-native-reanimated — set __workletsModuleProxy in C++ decorator
// ─────────────────────────────────────────────

const RNRUNTIME_DECORATOR = path.join(
  PROJECT_ROOT,
  'node_modules',
  'react-native-reanimated',
  'Common',
  'cpp',
  'ReanimatedRuntime',
  'RNRuntimeDecorator.cpp'
);

function patchRNRuntimeDecorator() {
  if (!fs.existsSync(RNRUNTIME_DECORATOR)) {
    warn(`RNRuntimeDecorator.cpp not found at ${RNRUNTIME_DECORATOR}, skipping patch`);
    return false;
  }

  let content = fs.readFileSync(RNRUNTIME_DECORATOR, 'utf8');

  // Skip if already patched
  if (content.includes('__workletsModuleProxy')) {
    log('RNRuntimeDecorator.cpp: already patched, skipping');
    return false;
  }

  const original = content;

  // Add __workletsModuleProxy property after __reanimatedModuleProxy
  content = content.replace(
    '      jsi::PropNameID::forAscii(rnRuntime, "__reanimatedModuleProxy"),\n      jsi::Object::createFromHostObject(rnRuntime, nativeReanimatedModule));',
    '      jsi::PropNameID::forAscii(rnRuntime, "__reanimatedModuleProxy"),\n      jsi::Object::createFromHostObject(rnRuntime, nativeReanimatedModule));\n  rnRuntime.global().setProperty(\n      rnRuntime,\n      jsi::PropNameID::forAscii(rnRuntime, "__workletsModuleProxy"),\n      jsi::Object::createFromHostObject(rnRuntime, nativeReanimatedModule));'
  );

  if (content === original) {
    warn('RNRuntimeDecorator.cpp: replacement pattern not found, skipping');
    return false;
  }

  fs.writeFileSync(RNRUNTIME_DECORATOR, content, 'utf8');
  log('✓ Patched RNRuntimeDecorator.cpp: set __workletsModuleProxy alongside __reanimatedModuleProxy');
  return true;
}

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────

function main() {
  log('Applying patches for EAS Build compatibility...\n');

  const p1 = patchExpoModulesCorePlugin();
  const p2 = patchExpoUpdatesBuildGradle();
  const p3 = patchReanimatedPackage();
  const p4 = patchRNRuntimeDecorator();

  if (p1 || p2 || p3 || p4) {
    log('\n✓ Patches applied successfully.');
  } else {
    log('\nNo patches needed (all already applied or packages not found).');
  }
}

main();

process.exit(0);
