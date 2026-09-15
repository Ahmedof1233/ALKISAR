const express = require('express');
const router  = express.Router();
const dbModule = require('../database');

// ── SSE Clients Store ─────────────────────────────────────────────────────────
const sseClients = new Map(); // clientId -> { res, orderId }

function broadcast(payload, targetOrderId = null) {
  const data = `data: ${JSON.stringify(payload)}\n\n`;
  sseClients.forEach((client, clientId) => {
    if (targetOrderId !== null && client.orderId !== targetOrderId) return;
    try {
      client.res.write(data);
    } catch {
      sseClients.delete(clientId);
    }
  });
}

// ── GET /api/orders/stream  (SSE) ─────────────────────────────────────────────
// يجب أن يكون قبل /:id لتجنب التعارض
router.get('/stream', async (req, res) => {
  const orderId = req.query.orderId ? parseInt(req.query.orderId) : null;

  res.setHeader('Content-Type',                'text/event-stream');
  res.setHeader('Cache-Control',               'no-cache');
  res.setHeader('Connection',                  'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  const clientId = `${Date.now()}_${Math.random()}`;
  sseClients.set(clientId, { res, orderId });

  // إرسال الحالة الأولية
  if (orderId) {
    const db = dbModule;
    const order = await db.get(
      'SELECT id, status, customer_name FROM orders WHERE id = ?',
      [orderId]
    );
    if (order) {
      res.write(`data: ${JSON.stringify({ type: 'init', order })}\n\n`);
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'الطلب غير موجود' })}\n\n`);
    }
  } else {
    // للداشبورد: أرسل إشارة اتصال ناجح
    res.write(`data: ${JSON.stringify({ type: 'connected', clientId })}\n\n`);
  }

  // Heartbeat كل 25 ثانية
  const heartbeat = setInterval(() => {
    try { res.write(': heartbeat\n\n'); } catch { clearInterval(heartbeat); }
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(clientId);
    console.log(`📡 SSE client disconnected: ${clientId}`);
  });
});

// ── GET /api/orders ───────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const db = dbModule;
    const { status } = req.query;
    let orders;

    if (status) {
      orders = await db.query('SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC', [status]);
    } else {
      orders = await db.query('SELECT * FROM orders ORDER BY created_at DESC');
    }

    const parsed = orders.map(o => ({
      ...o,
      items_json: typeof o.items_json === 'string' ? JSON.parse(o.items_json || '[]') : (o.items_json || [])
    }));
    res.json({ success: true, data: parsed });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/orders/:id ───────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const db = dbModule;
    const order = await db.get('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (!order) return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
    const parsedItems = typeof order.items_json === 'string'
      ? JSON.parse(order.items_json || '[]')
      : (order.items_json || []);
    res.json({ success: true, data: { ...order, items_json: parsedItems } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PATCH /api/orders/:id/status ─────────────────────────────────────────────
router.patch('/:id/status', async (req, res) => {
  try {
    const db = dbModule;
    const { status } = req.body;
    const validStatuses = ['pending', 'preparing', 'delivering', 'delivered', 'ready'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `الحالة يجب أن تكون: ${validStatuses.join(' | ')}`,
      });
    }

    const order = await db.get('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (!order) return res.status(404).json({ success: false, message: 'الطلب غير موجود' });

    // صيغة تحديث تدعم TiDB و SQLite
    const updateTimeSql = db.isTiDB() ? 'NOW()' : "datetime('now')";
    await db.run(
      `UPDATE orders SET status = ?, updated_at = ${updateTimeSql} WHERE id = ?`,
      [status, req.params.id]
    );

    const updated = await db.get('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    const parsedItems = typeof updated.items_json === 'string'
      ? JSON.parse(updated.items_json || '[]')
      : (updated.items_json || []);

    const payload = {
      type: 'status_update',
      order: {
        id:            updated.id,
        status:        updated.status,
        customer_name: updated.customer_name,
        updated_at:    updated.updated_at,
      },
    };

    // بث للعملاء الذين يتابعون هذا الطلب
    broadcast(payload, updated.id);
    // بث للداشبورد (orderId = null)
    broadcast({ ...payload, scope: 'dashboard' }, null);

    res.json({
      success: true,
      data: { ...updated, items_json: parsedItems },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/orders ──────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const db = dbModule;
    const { customer_name, customer_phone = '', customer_address = '', items, total_amount, notes = '' } = req.body;

    if (!customer_name || !items || !total_amount) {
      return res.status(400).json({ success: false, message: 'البيانات الأساسية مطلوبة' });
    }

    await db.run(
      'INSERT INTO orders (customer_name, customer_phone, customer_address, items_json, total_amount, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [customer_name, customer_phone, customer_address, JSON.stringify(items), total_amount, notes, 'pending']
    );

    const id = db.getLastId('orders');
    const order = await db.get('SELECT * FROM orders WHERE id = ?', [id]);

    if (!order) {
      return res.status(500).json({ success: false, message: 'تعذر استرجاع بيانات الطلب بعد حفظه' });
    }

    const parsedItems = typeof order.items_json === 'string'
      ? JSON.parse(order.items_json || '[]')
      : (order.items_json || []);

    const parsed = { ...order, items_json: parsedItems };

    // إشعار الداشبورد بطلب جديد
    broadcast({ type: 'new_order', order: parsed }, null);

    res.status(201).json({ success: true, data: parsed });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
