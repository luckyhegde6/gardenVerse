var path = require('path');
var root = path.resolve(__dirname, '..');
var rootNodeModules = path.resolve(root, '..', '..', 'node_modules');

var expoConfig = require('@expo/metro-config').getDefaultConfig(root);

expoConfig.projectRoot = root;
expoConfig.watch = false;
expoConfig.maxWorkers = 1;
expoConfig.resetCache = true;
expoConfig.cacheStores = [];

expoConfig.transformer.babelTransformerPath = require.resolve(
  '@expo/metro-config/build/babel-transformer'
);

expoConfig.watchFolders = [root, rootNodeModules];

expoConfig.resolver.nodeModulesPaths = [
  path.join(root, 'node_modules'),
  rootNodeModules,
];

var aliasMap = {
  '@': path.resolve(root, 'src'),
  '@components': path.resolve(root, 'src/components'),
  '@screens': path.resolve(root, 'src/screens'),
  '@services': path.resolve(root, 'src/services'),
  '@stores': path.resolve(root, 'src/stores'),
  '@hooks': path.resolve(root, 'src/hooks'),
  '@utils': path.resolve(root, 'src/utils'),
  '@types': path.resolve(root, 'src/types'),
  '@navigation': path.resolve(root, 'src/navigation'),
};

var fs = require('fs');
function resolveFile(basePath) {
  for (var ext of ['', '.ts', '.tsx', '.js', '.jsx']) {
    try {
      fs.statSync(basePath + ext);
      return basePath + ext;
    } catch (e) {}
  }
  return null;
}

expoConfig.resolver.resolveRequest = function (context, moduleName, platform) {
  for (var alias in aliasMap) {
    if (moduleName === alias) {
      var f = resolveFile(path.join(aliasMap[alias], 'index'));
      if (f) return { type: 'sourceFile', filePath: f };
      return context.resolveRequest(context, aliasMap[alias], platform);
    }
    if (moduleName.startsWith(alias + '/')) {
      var relativePath = moduleName.slice(alias.length + 1);
      var resolvedPath = path.resolve(aliasMap[alias], relativePath);
      var f = resolveFile(resolvedPath);
      if (f) return { type: 'sourceFile', filePath: f };
      return context.resolveRequest(context, resolvedPath, platform);
    }
  }
  return context.resolveRequest(context, moduleName, platform);
};

process.stdout.write('Starting bundle build...\n');

var metro = require('metro');
metro
  .runBuild(expoConfig, {
    entry: 'index.js',
    out: path.join(root, 'android/app/src/main/assets/index.android.bundle'),
    platform: 'android',
    dev: false,
    minify: false,
  })
  .then(function () {
    process.stdout.write('Bundle build succeeded!\n');
    process.exit(0);
  })
  .catch(function (err) {
    process.stderr.write('Bundle build failed: ' + (err.message || err) + '\n');
    if (err.stack) {
      process.stderr.write(err.stack + '\n');
    }
    process.exit(1);
  });
