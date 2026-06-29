const path = require('path');

module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      'babel-preset-expo',
      'nativewind/babel',
    ],
    plugins: [
      '@babel/plugin-transform-class-static-block',
      [
        'module-resolver',
        {
          root: ['.'],
          alias: {
            '@': path.resolve(__dirname, 'src'),
            '@components': path.resolve(__dirname, 'src/components'),
            '@screens': path.resolve(__dirname, 'src/screens'),
            '@services': path.resolve(__dirname, 'src/services'),
            '@stores': path.resolve(__dirname, 'src/stores'),
            '@hooks': path.resolve(__dirname, 'src/hooks'),
            '@utils': path.resolve(__dirname, 'src/utils'),
            '@types': path.resolve(__dirname, 'src/types'),
            '@navigation': path.resolve(__dirname, 'src/navigation'),
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
