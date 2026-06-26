// Standalone Metro bundle builder — avoids PowerShell hanging issues
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const mobileDir = 'F:\\Local_git\\gardenVerse\\packages\\mobile';
const cliPath = 'F:\\Local_git\\gardenVerse\\node_modules\\@react-native-community\\cli\\build\\index.js';
const bundleOut = path.join(mobileDir, 'android\\app\\src\\main\\assets\\index.android.bundle');
const assetsOut = path.join(mobileDir, 'android\\app\\src\\main\\res');

// Ensure output directory exists
const assetsDir = path.dirname(bundleOut);
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

console.log('Metro bundle build');
console.log('  Entry:', path.join(mobileDir, 'index.js'));
console.log('  Output:', bundleOut);
console.log('  Assets:', assetsOut);
console.log('  CLI:', cliPath);
console.log('  CWD:', mobileDir);

const env = {
  ...process.env,
  NODE_OPTIONS: '--max-old-space-size=4096',
  // Force SINGLE worker — no parallelism to avoid deadlocks
  METRO_MAX_WORKERS: '1',
};

try {
  const result = execSync(
    `node "${cliPath}" bundle --platform android --dev false --entry-file "${mobileDir}\\index.js" --bundle-output "${bundleOut}" --assets-dest "${assetsOut}"`,
    {
      cwd: mobileDir,
      env,
      stdio: 'inherit',
      timeout: 600000,
      maxBuffer: 1024 * 1024 * 100,
    }
  );
  
  const stat = fs.statSync(bundleOut);
  console.log('\n✓ Bundle built successfully!');
  console.log('  Size:', stat.size, 'bytes');
  
} catch (e) {
  console.error('\n✗ Bundle build failed:', e.message);
  if (e.stdout) console.log('stdout:', e.stdout.toString());
  if (e.stderr) console.log('stderr:', e.stderr.toString());
  process.exit(1);
}
