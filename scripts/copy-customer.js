const fs   = require('fs');
const path = require('path');

const root  = path.join(__dirname, '..');
const dist  = path.join(root, 'frontend', 'admin', 'dist');
const src   = path.join(root, 'frontend', 'customer');

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const item of fs.readdirSync(from)) {
    const s = path.join(from, item);
    const d = path.join(to, item);
    if (fs.statSync(s).isDirectory()) {
      copyDir(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

// 1. انسخ ملفات العميل إلى dist/customer/
copyDir(src, path.join(dist, 'customer'));
console.log('✅ Customer files → dist/customer/');

// 2. انسخ الصفحة الرئيسية (index.html الجذر) إلى dist/home.html
//    (اختياري — Vercel بيعمل serve لـ dist/customer/index.html من /customer)
console.log('✅ Done! dist structure ready for Vercel.');
