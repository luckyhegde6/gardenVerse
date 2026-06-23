const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// ── React Deduplication ─────────────────────────────────────────────────────
// Deduplicate React across ALL platforms (web + Android + iOS). Without this,
// the monorepo layout (react in root node_modules vs mobile's local
// node_modules) causes "Cannot read property 'useContext' of null" because
// two copies of React get bundled.
const ROOT_NODE_MODULES = path.resolve(__dirname, '../../node_modules');
const MOBILE_NODE_MODULES = path.resolve(__dirname, 'node_modules');

// Force metro to always resolve react and react-dom from a single location.
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  react: path.resolve(MOBILE_NODE_MODULES, 'react'),
  'react-dom': path.resolve(ROOT_NODE_MODULES, 'react-dom'),
};

// Use nodeModulesPaths so the Android/iOS bundle (not just web) resolves
// react from mobile's local node_modules, preventing duplicate copies.
config.resolver.nodeModulesPaths = [
  path.resolve(MOBILE_NODE_MODULES, 'react'),
].map(p => path.dirname(p));

// Custom resolveRequest to always redirect react to mobile's local copy.
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react' || moduleName.startsWith('react/')) {
    return context.resolveRequest(
      context,
      path.resolve(MOBILE_NODE_MODULES, moduleName),
      platform,
    );
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
