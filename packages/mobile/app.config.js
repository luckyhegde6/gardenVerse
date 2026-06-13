const IS_DEV = process.env.APP_ENV === 'development';
const DEV_API_URL =
  process.env.API_URL ||
  (IS_DEV
    ? 'http://localhost:3000/api/v1'
    : 'http://10.0.2.2:3000/api/v1');
const DEV_WS_URL =
  process.env.WS_URL ||
  (IS_DEV ? 'ws://localhost:3001' : 'ws://10.0.2.2:3001');

export default {
  expo: {
    name: 'GardenVerse',
    slug: 'gardenverse',
    version: '1.0.0',
    owner: 'luckyhegdedev',
    scheme: 'gardenverse',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#166534',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.gardenverse.app',
      infoPlist: {
        NSCameraUsageDescription:
          'GardenVerse uses the camera to scan plants for AI health analysis and QR codes for sharing.',
        NSLocationWhenInUseUsageDescription:
          'GardenVerse uses your location to show local weather forecasts and nearby gardeners.',
        NSLocationAlwaysAndWhenInUseUsageDescription:
          'GardenVerse uses your location to provide garden-specific weather alerts.',
        NSLocationAlwaysUsageDescription:
          'GardenVerse uses your location to provide garden-specific weather alerts.',
        NSPhotoLibraryUsageDescription:
          'GardenVerse needs access to your photo library to upload garden photos.',
        NSUserNotificationCenterUsageDescription:
          'GardenVerse sends notifications for garden growth updates and weather alerts.',
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#166534',
      },
      package: 'com.gardenverse.app',
      permissions: [
        'CAMERA',
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
        'RECEIVE_BOOT_COMPLETED',
        'VIBRATE',
        'WAKE_LOCK',
        'POST_NOTIFICATIONS',
        'INTERNET',
      ],
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY || '',
        },
      },
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      [
        'expo-camera',
        {
          cameraPermission:
            'Allow GardenVerse to access your camera for plant scanning.',
        },
      ],
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission:
            'Allow GardenVerse to use your location for weather alerts.',
          locationAlwaysPermission:
            'Allow GardenVerse to use your location for garden weather alerts.',
          locationWhenInUsePermission:
            'Allow GardenVerse to use your location for local weather.',
        },
      ],
      [
        'expo-notifications',
        {
          icon: './assets/notification-icon.png',
          color: '#166534',
        },
      ],
      [
        'expo-image-picker',
        {
          photosPermission: 'Allow GardenVerse to access your photos.',
        },
      ],
      [
        'expo-barcode-scanner',
        {
          cameraPermission:
            'Allow GardenVerse to access your camera for scanning.',
        },
      ],
      'expo-router',
      'expo-secure-store',
      'expo-file-system',
    ],
    extra: {
      apiUrl:
        process.env.API_URL ||
        (IS_DEV ? DEV_API_URL : 'https://gardenverse.vercel.app/api/v1'),
      wsUrl:
        process.env.WS_URL ||
        (IS_DEV ? DEV_WS_URL : 'wss://ws.gardenverse.app'),
      eas: {
        projectId:
          process.env.EAS_PROJECT_ID ||
          '5c01de7d-484e-4704-b4a1-d5833b59d62c',
      },
    },
  },
};
