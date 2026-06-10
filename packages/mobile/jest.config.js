const path = require('path');
const fs = require('fs');

// Fix: react-native in root node_modules is an empty stub (Expo hoisting).
// jest-expo preset requires react-native/jest-preset + its internal files.
// Create a shim that delegates to the real react-native package in mobile/node_modules.
const rootRnDir = path.join(__dirname, '..', '..', 'node_modules', 'react-native');
const realRnDir = path.join(__dirname, 'node_modules', 'react-native');
const presetFile = path.join(rootRnDir, 'jest-preset.js');

if (!fs.existsSync(presetFile) && fs.existsSync(path.join(realRnDir, 'jest-preset.js'))) {
  fs.mkdirSync(rootRnDir, { recursive: true });
  // Re-export from the real react-native package
  fs.writeFileSync(
    presetFile,
    `module.exports = require(${JSON.stringify(realRnDir + '/jest-preset.js')});\n`
  );
}

module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
};
