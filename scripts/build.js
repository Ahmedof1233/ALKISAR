const { execSync } = require('child_process');
const fs   = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

// 1. Build Admin React App
console.log('📦 Building Admin React app...');
execSync('npm install', {
  cwd: path.join(root, 'frontend', 'admin'),
  stdio: 'inherit'
});
execSync('npm run build', {
  cwd: path.join(root, 'frontend', 'admin'),
  stdio: 'inherit'
});
console.log('✅ Admin build done!');

// 2. Copy Customer HTML files into dist/customer/
const distDir = path.join(root, 'frontend', 'admin', 'dist');
const srcDir  = path.join(root, 'frontend', 'customer');
const destDir = path.join(distDir, 'customer');

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const item of fs.readdirSync(from)) {
    const s = path.join(from, item);
    const d = path.join(to, item);
    if (fs.statSync(s).isDirectory()) {
      copyDir(s, d);
    } else {
      fs.copyFileSync(s, d);
      console.log(`  copied: ${path.relative(root, d)}`);
    }
  }
}

console.log('\n📋 Copying customer pages into dist/customer/...');
copyDir(srcDir, destDir);
console.log('✅ Customer pages copied!\n');

// 3. Verify output
const files = fs.readdirSync(distDir);
console.log('📁 dist/ contents:', files);
