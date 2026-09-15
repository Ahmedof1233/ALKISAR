# دليل نشر وتشغيل مشروع مطعم القيصر على سيرفر حقيقي (Production) 🚀

---

## 1. المتطلبات السابقة على السيرفر (Server Requirements)
- خادم بنظام **Ubuntu 22.04 / 24.04 LTS** (مثل VPS على Hetzner أو DigitalOcean أو AWS أو سيرفر محلي داخل المطعم).
- مثبت عليه:
  - `Node.js v20+`
  - `Nginx`
  - `PM2` (مدير العمليات في الخلفية)
  - `Certbot` (للحصول على شهادة SSL مجانية HTTPS)

---

## 2. خطوات تجهيز الباك إند (Backend)

1. **نسخ ملفات المشروع إلى السيرفر:**
   ```bash
   mkdir -p /var/www/qaysar
   cd /var/www/qaysar
   # انسخ مجلدي backend و frontend
   ```

2. **تثبيت الحزم وإنشاء ملف البيئة:**
   ```bash
   cd /var/www/qaysar/backend
   npm install --production
   cp .env.example .env
   ```

3. **تشغيل السيرفر باستخدام PM2:**
   ```bash
   npm install -g pm2
   pm2 start server.js --name "qaysar-api"
   pm2 save
   pm2 startup
   ```

---

## 3. خطوات تجهيز لوحة الإدارة وواجهة العميل (Frontend)

1. **بناء لوحة الأدمن (React Build):**
   ```bash
   cd /var/www/qaysar/frontend/admin
   npm install
   npm run build
   # سينتج مجلد dist جاهز للإنتاج
   ```

---

## 4. إعداد Nginx (Reverse Proxy & Web Server)

أنشئ ملف إعداد Nginx:
```bash
sudo nano /etc/nginx/sites-available/qaysar
```

الصق الإعداد التالي (مع استبدال `your-domain.com` بدومينك أو IP السيرفر):

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # 1. واجهة العميل (Customer HTML)
    location / {
        root /var/www/qaysar/frontend/customer;
        index order.html index.html;
        try_files $uri $uri/ =404;
    }

    # 2. لوحة الإدارة (Admin React Build)
    location /admin {
        alias /var/www/qaysar/frontend/admin/dist;
        try_files $uri $uri/ /admin/index.html;
    }

    # 3. الـ API وطلبات السيرفر
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        # إعدادات خاصة بـ Server-Sent Events (SSE) للتتبع المباشر
        proxy_buffering off;
        proxy_read_timeout 86400s;
    }

    # 4. صور الأصناف المرفوعة
    location /uploads/ {
        alias /var/www/qaysar/backend/uploads/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}
```

تفعيل الإعداد وإعادة تشغيل Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/qaysar /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 5. تفعيل شهادة الأمان المجانية (HTTPS / SSL)
ضرورية جداً لأن المتصفحات لا تسمح بإشعارات المتصفح (Web Notifications) بدون HTTPS:
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

---

## 6. كلمات المرور الافتراضية
- **لوحة الإدارة:** كلمة المرور الحالية المحددة هي `qaysar2026`.
- يمكنك تغييرها من متغير البيئة `VITE_ADMIN_PASSWORD` في `.env` الخاص بالـ admin أو تعديلها من الكود.
