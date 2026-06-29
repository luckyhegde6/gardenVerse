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

// Map TypeScript path aliases (@components, @stores, @utils, @/*, etc.) to actual source paths
const aliasMap = {
  '@': path.resolve(__dirname, 'src'),
  '@components': path.resolve(__dirname, 'src/components'),
  '@screens': path.resolve(__dirname, 'src/screens'),
  '@services': path.resolve(__dirname, 'src/services'),
  '@stores': path.resolve(__dirname, 'src/stores'),
  '@hooks': path.resolve(__dirname, 'src/hooks'),
  '@utils': path.resolve(__dirname, 'src/utils'),
  '@types': path.resolve(__dirname, 'src/types'),
  '@navigation': path.resolve(__dirname, 'src/navigation'),
};

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Check if moduleName starts with one of the aliases
  for (const [alias, targetDir] of Object.entries(aliasMap)) {
    if (moduleName === alias) {
      // Exact match: @alias → src/alias/index or src/alias
      return context.resolveRequest(context, targetDir, platform);
    }
    if (moduleName.startsWith(alias + '/')) {
      // Prefix match: @alias/path → src/alias/path
      const relativePath = moduleName.slice(alias.length + 1);
      const resolvedPath = path.resolve(targetDir, relativePath);
      return context.resolveRequest(context, resolvedPath, platform);
    }
  }
  // Fall through to default resolver
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
