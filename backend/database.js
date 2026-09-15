require('dotenv').config();
const path = require('path');
const fs   = require('fs');

let isTiDB = false;
let tidbPool = null;
let sqliteDb = null;
let lastInsertedId = null;

const DB_PATH = path.join(__dirname, 'qaysar.db');

if (process.env.TIDB_HOST && process.env.TIDB_USER) {
  isTiDB = true;
}

// ── تهيئة TiDB (MySQL Pool) ───────────────────────────────────────────────────
function initTiDB() {
  const mysql = require('mysql2/promise');
  const config = {
    host: process.env.TIDB_HOST,
    port: parseInt(process.env.TIDB_PORT) || 4000,
    user: process.env.TIDB_USER,
    password: process.env.TIDB_PASSWORD,
    database: process.env.TIDB_DATABASE || 'test',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: process.env.TIDB_ENABLE_SSL === 'false' ? false : {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: true
    }
  };

  tidbPool = mysql.createPool(config);
  console.log(`🌐 جاري الاتصال بقاعدة بيانات TiDB Cloud على ${process.env.TIDB_HOST}...`);
}

// ── استعلامات موحدة متوافقة مع Async و Sync ──────────────────────────────────
async function query(sql, params = []) {
  if (isTiDB) {
    const [rows] = await tidbPool.query(sql, params);
    return rows;
  }
  const stmt = sqliteDb.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

async function run(sql, params = []) {
  if (isTiDB) {
    const [result] = await tidbPool.query(sql, params);
    if (result && result.insertId) {
      lastInsertedId = result.insertId;
    }
    return result;
  }
  sqliteDb.run(sql, params);
  saveDb();
}

async function get(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

function getLastId(table = 'orders') {
  if (lastInsertedId) {
    const id = lastInsertedId;
    lastInsertedId = null;
    return id;
  }
  if (!isTiDB && sqliteDb) {
    try {
      const res = sqliteDb.exec('SELECT last_insert_rowid() as id');
      if (res && res[0] && res[0].values && res[0].values[0] && res[0].values[0][0]) {
        const id = res[0].values[0][0];
        if (id > 0) return id;
      }
    } catch {}
    try {
      const stmt = sqliteDb.prepare(`SELECT MAX(id) as id FROM ${table}`);
      stmt.step();
      const row = stmt.getAsObject();
      stmt.free();
      return row.id;
    } catch {}
  }
  return null;
}

function saveDb() {
  if (!sqliteDb || isTiDB) return;
  const data = sqliteDb.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

// ── Schema ────────────────────────────────────────────────────────────────────
const TIDB_SCHEMA = `
  CREATE TABLE IF NOT EXISTS items (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    price       DECIMAL(10,2) NOT NULL,
    category    VARCHAR(100) DEFAULT 'عام',
    available   TINYINT DEFAULT 1,
    image_url   TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS orders (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    customer_name    VARCHAR(255) NOT NULL,
    customer_phone   VARCHAR(50) DEFAULT '',
    customer_address TEXT,
    items_json       LONGTEXT NOT NULL,
    total_amount     DECIMAL(10,2) NOT NULL,
    status           VARCHAR(50) DEFAULT 'pending',
    notes            TEXT,
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  );
`;

const SQLITE_SCHEMA = `
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

async function seedTiDB() {
  const [rows] = await tidbPool.query('SELECT COUNT(*) as c FROM items');
  if (rows[0].c > 0) return;

  const data = [
    ['كبسة لحم',   'أرز بسمتي مع لحم ضأن طازج وتوابل',  45, 'رئيسي',    1],
    ['مندي دجاج',  'دجاج مدخن مع الأرز الأصفر',           38, 'رئيسي',    1],
    ['سلطة فتوش',  'خضروات طازجة مع خبز محمص',             15, 'سلطات',    1],
    ['حمص بطحينة', 'حمص ناعم مع زيت الزيتون',              12, 'مقبلات',   1],
    ['عصير مانجو', 'عصير مانجو طبيعي طازج',                10, 'مشروبات',  1],
    ['كنافة',      'كنافة بالجبن والقطر',                  18, 'حلويات',   1],
  ];
  for (const item of data) {
    await tidbPool.query('INSERT INTO items (name,description,price,category,available) VALUES (?,?,?,?,?)', item);
  }
  console.log('✅ TiDB: تم تجهيز قائمة الأصناف بنجاح');
}

async function initDb() {
  if (isTiDB) {
    initTiDB();
    const queries = TIDB_SCHEMA.split(';').filter(q => q.trim().length > 0);
    for (const q of queries) {
      await tidbPool.query(q);
    }
    await seedTiDB();
    console.log('🚀 متصل بقاعدة بيانات TiDB Cloud (MySQL) بنجاح');
    return tidbPool;
  }

  const initSqlJs = require('sql.js');
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    sqliteDb = new SQL.Database(fs.readFileSync(DB_PATH));
    console.log('📂 تم تحميل قاعدة البيانات المحلية SQLite');
  } else {
    sqliteDb = new SQL.Database();
    console.log('🆕 إنشاء قاعدة بيانات محلي SQLite جديدة');
  }
  sqliteDb.run(SQLITE_SCHEMA);
  return sqliteDb;
}

module.exports = {
  initDb,
  query,
  run,
  get,
  getLastId,
  saveDb,
  isTiDB: () => isTiDB,
  getPool: () => tidbPool
};
