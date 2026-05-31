const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// ── React Deduplication ─────────────────────────────────────────────────────
// Deduplicate React in the web bundle so there's only one copy. Without this,
// the monorepo layout (react in root node_modules vs mobile's local
// node_modules) causes "Cannot read properties of null (reading 'useEffect')".
const ROOT_NODE_MODULES = path.resolve(__dirname, '../../node_modules');

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  react: path.resolve(ROOT_NODE_MODULES, 'react'),
  'react-dom': path.resolve(ROOT_NODE_MODULES, 'react-dom'),
};

module.exports = config;
