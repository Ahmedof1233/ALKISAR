const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const router  = express.Router();
const db      = require('../database');

// ── Multer setup ──────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination(req, file, cb) {
    const dir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `item_${req.params.id}_${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter(req, file, cb) {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('يجب أن يكون الملف صورة'));
  },
});

// GET /api/items
router.get('/', async (req, res) => {
  try {
    const items = await db.query('SELECT * FROM items ORDER BY category, name');
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/items/:id
router.get('/:id', async (req, res) => {
  try {
    const item = await db.get('SELECT * FROM items WHERE id = ?', [req.params.id]);
    if (!item) return res.status(404).json({ success: false, message: 'الصنف غير موجود' });
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/items
router.post('/', async (req, res) => {
  try {
    const { name, description = '', price, category = 'عام', available = 1, image_url = '' } = req.body;
    if (!name || price === undefined)
      return res.status(400).json({ success: false, message: 'الاسم والسعر مطلوبان' });
    await db.run(
      'INSERT INTO items (name,description,price,category,available,image_url) VALUES(?,?,?,?,?,?)',
      [name, description, price, category, available, image_url]
    );
    const id   = db.getLastId('items');
    const item = await db.get('SELECT * FROM items WHERE id = ?', [id]);
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/items/:id
router.put('/:id', async (req, res) => {
  try {
    const existing = await db.get('SELECT * FROM items WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ success: false, message: 'الصنف غير موجود' });
    const { name, description, price, category, available, image_url } = req.body;
    await db.run(
      'UPDATE items SET name=?,description=?,price=?,category=?,available=?,image_url=? WHERE id=?',
      [
        name        ?? existing.name,
        description ?? existing.description,
        price       ?? existing.price,
        category    ?? existing.category,
        available   ?? existing.available,
        image_url   ?? existing.image_url,
        req.params.id,
      ]
    );
    const updated = await db.get('SELECT * FROM items WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/items/:id/image — رفع صورة
router.post('/:id/image', upload.single('image'), async (req, res) => {
  try {
    const item = await db.get('SELECT * FROM items WHERE id = ?', [req.params.id]);
    if (!item) return res.status(404).json({ success: false, message: 'الصنف غير موجود' });
    if (!req.file)  return res.status(400).json({ success: false, message: 'لم يُرفع أي ملف' });

    // حذف الصورة القديمة إن وجدت
    if (item.image_url) {
      const oldPath = path.join(__dirname, '..', item.image_url.replace('/uploads/', 'uploads/'));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const image_url = `/uploads/${req.file.filename}`;
    await db.run('UPDATE items SET image_url = ? WHERE id = ?', [image_url, req.params.id]);
    const updated = await db.get('SELECT * FROM items WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/items/:id/image — حذف الصورة
router.delete('/:id/image', async (req, res) => {
  try {
    const item = await db.get('SELECT * FROM items WHERE id = ?', [req.params.id]);
    if (!item) return res.status(404).json({ success: false, message: 'الصنف غير موجود' });
    if (item.image_url) {
      const imgPath = path.join(__dirname, '..', item.image_url.replace('/uploads/', 'uploads/'));
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }
    await db.run("UPDATE items SET image_url = '' WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: 'تم حذف الصورة' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/items/:id
router.delete('/:id', async (req, res) => {
  try {
    const existing = await db.get('SELECT * FROM items WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ success: false, message: 'الصنف غير موجود' });
    await db.run('DELETE FROM items WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'تم حذف الصنف' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
