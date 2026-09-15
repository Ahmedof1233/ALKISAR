const initSqlJs = require('sql.js');
const path = require('path');
const fs   = require('fs');

const DB_PATH = path.join(__dirname, 'qaysar.db');
let db = null;

function saveDb() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function query(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function run(sql, params = []) {
  db.run(sql, params);
  saveDb();
}

function get(sql, params = []) {
  const rows = query(sql, params);
  return rows[0] || null;
}

function getLastId(table = 'orders') {
  try {
    const res = db.exec('SELECT last_insert_rowid() as id');
    if (res && res[0] && res[0].values && res[0].values[0] && res[0].values[0][0]) {
      const id = res[0].values[0][0];
      if (id > 0) return id;
    }
  } catch {}
  try {
    const row = get(`SELECT MAX(id) as id FROM ${table}`);
    return row ? row.id : null;
  } catch {}
  return null;
}

// ── Schema ────────────────────────────────────────────────────────────────────
const SCHEMA = `
  CREATE TABLE IF NOT EXISTS items (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    description TEXT    DEFAULT '',
    price       REAL    NOT NULL,
    category    TEXT    DEFAULT 'عام',
    available   INTEGER DEFAULT 1,
    image_url   TEXT    DEFAULT '',
    created_at  TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS orders (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name   TEXT    NOT NULL,
    customer_phone  TEXT    DEFAULT '',
    customer_address TEXT   DEFAULT '',
    items_json      TEXT    NOT NULL,
    total_amount    REAL    NOT NULL,
    status          TEXT    DEFAULT 'pending',
    notes           TEXT    DEFAULT '',
    created_at      TEXT    DEFAULT (datetime('now')),
    updated_at      TEXT    DEFAULT (datetime('now'))
  );
`;

// ── Migration: إضافة الأعمدة الجديدة إن لم تكن موجودة ──────────────────────
function migrate() {
  const safeAdd = (table, col, def) => {
    try { db.run(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`); }
    catch { /* العمود موجود مسبقاً */ }
  };
  safeAdd('items',  'image_url',        "TEXT DEFAULT ''");
  safeAdd('orders', 'customer_address', "TEXT DEFAULT ''");
}

// ── Seed ─────────────────────────────────────────────────────────────────────
function seedItems() {
  const count = get('SELECT COUNT(*) as c FROM items').c;
  if (count > 0) return;
  const data = [
    ['كبسة لحم',   'أرز بسمتي مع لحم ضأن طازج وتوابل',  45, 'رئيسي',    1],
    ['مندي دجاج',  'دجاج مدخن مع الأرز الأصفر',           38, 'رئيسي',    1],
    ['سلطة فتوش',  'خضروات طازجة مع خبز محمص',             15, 'سلطات',    1],
    ['حمص بطحينة', 'حمص ناعم مع زيت الزيتون',              12, 'مقبلات',   1],
    ['عصير مانجو', 'عصير مانجو طبيعي طازج',                10, 'مشروبات',  1],
    ['كنافة',      'كنافة بالجبن والقطر',                  18, 'حلويات',   1],
  ];
  data.forEach(([n,d,p,c,a]) =>
    db.run('INSERT INTO items (name,description,price,category,available) VALUES(?,?,?,?,?)', [n,d,p,c,a])
  );
  saveDb();
  console.log('✅ بيانات الأصناف جاهزة');
}

function seedOrders() {
  const count = get('SELECT COUNT(*) as c FROM orders').c;
  if (count > 0) return;
  const rows = [
    ['أحمد محمد',   '0501234567', 'شارع النيل، الدور الثاني',  JSON.stringify([{id:1,name:'كبسة لحم',qty:2,price:45}]),                                                        90, 'pending',   'بدون بصل'],
    ['سارة العمري', '0557654321', 'ميدان التحرير، برج الياسمين', JSON.stringify([{id:2,name:'مندي دجاج',qty:1,price:38},{id:3,name:'سلطة فتوش',qty:1,price:15}]),             53, 'preparing', ''],
    ['خالد السعيد', '0512345678', 'حي الزمالك، شارع 26 يوليو',  JSON.stringify([{id:6,name:'كنافة',qty:3,price:18}]),                                                          54, 'ready',     'توصيل للطابق الثاني'],
  ];
  rows.forEach(([n,ph,addr,items,total,status,notes]) =>
    db.run('INSERT INTO orders (customer_name,customer_phone,customer_address,items_json,total_amount,status,notes) VALUES(?,?,?,?,?,?,?)',
      [n,ph,addr,items,total,status,notes])
  );
  saveDb();
  console.log('✅ بيانات الطلبات جاهزة');
}

// ── Init ─────────────────────────────────────────────────────────────────────
async function initDb() {
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    db = new SQL.Database(fs.readFileSync(DB_PATH));
    console.log('📂 تم تحميل قاعدة البيانات');
  } else {
    db = new SQL.Database();
    console.log('🆕 قاعدة بيانات جديدة');
  }
  db.run(SCHEMA);
  migrate();
  seedItems();
  seedOrders();
  return db;
}

module.exports = { initDb, query, run, get, getLastId, saveDb };
