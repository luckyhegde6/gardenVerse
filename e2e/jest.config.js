/** @type {import('jest').Config} */
module.exports = {
  rootDir: '.',
  testRunner: 'jest-circus/runner',
  testMatch: ['**/*.test.ts'],
  testTimeout: 120000,
  maxWorkers: 1,
  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  reporters: ['detox/runners/jest/reporter'],
  testEnvironment: 'detox/runners/jest-circus/environment',
  verbose: true,
  moduleNameMapper: {
    '^detox$': 'detox',
  },
};