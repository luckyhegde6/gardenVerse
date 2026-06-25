const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Deduplicate react from mobile's local node_modules to avoid
// "useContext" crash caused by multiple React copies
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(__dirname, '..', '..', 'node_modules'),
];
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  react: path.resolve(__dirname, 'node_modules', 'react'),
  'react-dom': path.resolve(__dirname, '..', '..', 'node_modules', 'react-dom'),
};

// Limit workers to avoid resource exhaustion
config.maxWorkers = 2;

module.exports = config;
