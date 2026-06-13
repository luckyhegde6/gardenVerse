/** @type {import('jest').Config} */
module.exports = {
  rootDir: '.',
  testRunner: 'jest-circus',
  testMatch: ['**/*.test.ts'],
  testTimeout: 120000,
  maxWorkers: 1,
  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  reporters: ['detox/runners/jest/reporter'],
  testEnvironment: 'detox/runners/jest/testEnvironment',
  verbose: true,
  // Ensure jest can find detox helpers
  moduleNameMapper: {
    '^detox$': 'detox',
  },
};
