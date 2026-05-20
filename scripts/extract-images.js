/**
 * Extract images-*.zip into project /images folder (for dashboard & site photos)
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'images');

function findZip() {
  const names = fs.readdirSync(ROOT);
  const zips = names.filter(function(n) {
    return /^images-.*\.zip$/i.test(n) || n.toLowerCase() === 'images.zip';
  });
  return zips.length ? path.join(ROOT, zips[0]) : null;
}

const zipPath = findZip();
if (!zipPath) {
  console.error('No images zip found in project root.');
  console.error('Place images-20260520T124118Z-3-001.zip (or images.zip) in:');
  console.error(ROOT);
  process.exit(1);
}

if (!fs.existsSync(OUT)) {
  fs.mkdirSync(OUT, { recursive: true });
}

console.log('Extracting:', zipPath);
console.log('To:', OUT);

if (process.platform === 'win32') {
  const ps = process.env.SystemRoot
    ? path.join(process.env.SystemRoot, 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe')
    : 'powershell.exe';
  const cmd =
    "Expand-Archive -LiteralPath '" +
    zipPath.replace(/'/g, "''") +
    "' -DestinationPath '" +
    OUT.replace(/'/g, "''") +
    "' -Force";
  const r = spawnSync(ps, ['-NoProfile', '-Command', cmd], { stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status || 1);
} else {
  const r = spawnSync('unzip', ['-o', zipPath, '-d', OUT], { stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status || 1);
}

// Zip often contains images/images/ — move files up to project /images
const nested = path.join(OUT, 'images');
if (fs.existsSync(nested) && fs.statSync(nested).isDirectory()) {
  fs.readdirSync(nested).forEach(function(name) {
    const from = path.join(nested, name);
    const to = path.join(OUT, name);
    if (fs.existsSync(to)) {
      const st = fs.statSync(to);
      if (st.isDirectory()) {
        fs.rmSync(to, { recursive: true, force: true });
      } else {
        fs.unlinkSync(to);
      }
    }
    fs.renameSync(from, to);
  });
  fs.rmSync(nested, { recursive: true, force: true });
  console.log('Moved files from images/images/ to images/');
}

const files = fs.readdirSync(OUT).filter(function(n) {
  return fs.statSync(path.join(OUT, n)).isFile();
});
console.log('Done. Image files in images/:', files.length);
console.log('Refresh dashboard.html in the browser (Ctrl+F5).');
