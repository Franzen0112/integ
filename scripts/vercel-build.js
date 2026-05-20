/**
 * Vercel build: generate Supabase config + copy static site into public/
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');

const SKIP_FILES = new Set([
  'server.js',
  'package.json',
  'package-lock.json',
  'vercel.json'
]);

const SKIP_DIRS = new Set([
  'scripts',
  'node_modules',
  '.git',
  '.vscode',
  'public'
]);

const SKIP_EXT = new Set(['.md', '.sql', '.zip', '.example']);

function shouldCopy(name, isDir) {
  if (SKIP_DIRS.has(name)) return false;
  if (isDir) return name === 'auth' || name === 'images';
  if (SKIP_FILES.has(name)) return false;
  const ext = path.extname(name).toLowerCase();
  if (SKIP_EXT.has(ext)) return false;
  if (name.startsWith('.') && name !== '.gitattributes') return false;
  return (
    ext === '.html' ||
    ext === '.css' ||
    ext === '.js' ||
    ext === '.json' ||
    name === '.gitattributes'
  );
}

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      const srcPath = path.join(src, entry);
      const destPath = path.join(dest, entry);
      if (fs.statSync(srcPath).isDirectory()) {
        if (shouldCopy(entry, true)) copyRecursive(srcPath, destPath);
      } else if (shouldCopy(entry, false)) {
        fs.copyFileSync(srcPath, destPath);
      }
    }
    return;
  }
  fs.copyFileSync(src, dest);
}

console.log('1/2 Generating supabase-config.js...');
require('./generate-supabase-config.js');

console.log('2/2 Copying site to public/...');
if (fs.existsSync(PUBLIC)) {
  fs.rmSync(PUBLIC, { recursive: true, force: true });
}
fs.mkdirSync(PUBLIC, { recursive: true });

for (const entry of fs.readdirSync(ROOT)) {
  const srcPath = path.join(ROOT, entry);
  const isDir = fs.statSync(srcPath).isDirectory();
  if (!shouldCopy(entry, isDir)) continue;
  copyRecursive(srcPath, path.join(PUBLIC, entry));
}

console.log('Build complete → public/');
