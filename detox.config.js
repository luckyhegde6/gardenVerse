/** @type {import('detox').DetoxConfig} */
module.exports = {
  apps: {
    default: {
      type: 'android.apk',
      binaryPath: 'packages/mobile/android/app/build/outputs/apk/debug/app-debug.apk',
      build: 'cd packages/mobile/android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug',
      reversePorts: [8081, 3000],
    },
  },
  devices: {
    emulator: {
      type: 'android.emulator',
      device: {
        avdName: 'Pixel_7_API_34',
      },
    },
  },
  configurations: {
    'android.emu.debug': {
      device: 'emulator',
      app: 'default',
      testRunner: {
        command: 'node',
        args: ['./node_modules/jest/bin/jest.js', '--config', 'e2e/mobile/jest.config.js'],
      },
      artifacts: {
        plugins: {
          log: {
            enabled: true,
            keepOnlyFailedTestsArtifacts: false,
          },
          screenshot: {
            enabled: true,
            shouldTakeAutomaticSnapshots: false,
            keepOnlyFailedTestsArtifacts: false,
          },
          video: {
            enabled: false,
          },
          instruments: {
            enabled: false,
          },
          uiHierarchy: {
            enabled: false,
          },
        },
      },
      behavior: {
        init: {
          keepLockFile: false,
          reinstallApp: true,
          exposeGlobals: true,
        },
        cleanup: {
          shutdownDevice: false,
        },
      },
    },
  },
};