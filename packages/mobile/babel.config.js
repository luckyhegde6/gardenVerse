module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      'babel-preset-expo',
      'nativewind/babel',
    ],
    plugins: [
      '@babel/plugin-transform-class-static-block',
      'react-native-reanimated/plugin',
    ],
  };
};
