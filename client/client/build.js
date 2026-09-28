const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('[Dhwani Vercel Proxy] Triggering main client build...');
const parentDir = path.resolve(__dirname, '..');
execSync('npm run build', { cwd: parentDir, stdio: 'inherit' });

const parentDist = path.join(parentDir, 'dist');
const localDist = path.join(__dirname, 'dist');

if (fs.existsSync(parentDist)) {
  console.log('[Dhwani Vercel Proxy] Mirroring dist output to client/client/dist for Vercel outputDirectory compatibility...');
  if (fs.existsSync(localDist)) {
    fs.rmSync(localDist, { recursive: true, force: true });
  }
  fs.cpSync(parentDist, localDist, { recursive: true });
  console.log('[Dhwani Vercel Proxy] Build & distribution mirroring complete.');
}
