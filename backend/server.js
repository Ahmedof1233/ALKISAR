const express    = require('express');
const cors       = require('cors');
const path       = require('path');
const { initDb } = require('./database');

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: '*' }));
app.use(express.json());
// تقديم ملفات الصور المرفوعة
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Bootstrap: تهيئة DB أولاً ثم تشغيل السيرفر ───────────────────────────────
initDb().then((dbInstance) => {
  // تمرير instance للـ routes عبر module cache
  const dbModule  = require('./database');
  // Override helpers ليستخدموا الـ instance الفعلية
  Object.assign(dbModule, {
    query: (sql, params = []) => {
      const stmt = dbInstance.prepare(sql);
      stmt.bind(params);
      const rows = [];
      while (stmt.step()) rows.push(stmt.getAsObject());
      stmt.free();
      return rows;
    },
    run: (sql, params = []) => {
      dbInstance.run(sql, params);
      const fs   = require('fs');
      const path = require('path');
      const data = dbInstance.export();
      fs.writeFileSync(path.join(__dirname, 'qaysar.db'), Buffer.from(data));
    },
    get: (sql, params = []) => {
      const stmt = dbInstance.prepare(sql);
      stmt.bind(params);
      const row = stmt.step() ? stmt.getAsObject() : null;
      stmt.free();
      return row;
    },
    getLastId: (table = 'orders') => {
      try {
        const res = dbInstance.exec('SELECT last_insert_rowid() as id');
        if (res && res[0] && res[0].values && res[0].values[0] && res[0].values[0][0]) {
          const id = res[0].values[0][0];
          if (id > 0) return id;
        }
      } catch {}
      try {
        const stmt = dbInstance.prepare(`SELECT MAX(id) as id FROM ${table}`);
        stmt.step();
        const row = stmt.getAsObject();
        stmt.free();
        return row.id;
      } catch {}
      return null;
    },
  });

  const itemsRouter  = require('./routes/items');
  const ordersRouter = require('./routes/orders');

  app.use('/api/items',  itemsRouter);
  app.use('/api/orders', ordersRouter);

  app.get('/api/health', (req, res) => {
    res.json({ success: true, message: '🍽️ مطعم القيصر — الخادم يعمل بنجاح', timestamp: new Date() });
  });

  app.use((req, res) => {
    res.status(404).json({ success: false, message: `المسار ${req.path} غير موجود` });
  });

  app.use((err, req, res, next) => {
    console.error('❌ Server Error:', err);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  });

  app.listen(PORT, () => {
    console.log(`\n🚀 مطعم القيصر — الخادم يعمل على http://localhost:${PORT}`);
    console.log(`\n📋 Endpoints:`);
    console.log(`   GET    /api/health`);
    console.log(`   GET    /api/items`);
    console.log(`   POST   /api/items`);
    console.log(`   PUT    /api/items/:id`);
    console.log(`   DELETE /api/items/:id`);
    console.log(`   GET    /api/orders`);
    console.log(`   GET    /api/orders/:id`);
    console.log(`   PATCH  /api/orders/:id/status`);
    console.log(`   GET    /api/orders/stream  ← SSE`);
    console.log(`\n✅ قاعدة البيانات جاهزة\n`);
  });
}).catch(err => {
  console.error('❌ فشل تهيئة قاعدة البيانات:', err);
  process.exit(1);
});
