const initSqlJs = require('sql.js');
const fs        = require('fs');
const path      = require('path');

const DB_PATH = path.join(__dirname, '..', 'locai.db');
let db = null;

async function getDB() {
  if (db) return db;
  const SQL = await initSqlJs();
  db = fs.existsSync(DB_PATH)
    ? new SQL.Database(fs.readFileSync(DB_PATH))
    : new SQL.Database();
  initTables();
  return db;
}

function save() {
  if (!db) return;
  fs.writeFileSync(DB_PATH, Buffer.from(db.export()));
}

function initTables() {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      name         TEXT NOT NULL,
      email        TEXT NOT NULL UNIQUE,
      password     TEXT NOT NULL,
      created_at   TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS searches (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER,
      query      TEXT NOT NULL,
      lat        REAL, lng REAL, city TEXT, country TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS chat_sessions (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL UNIQUE,
      user_id    INTEGER,
      city TEXT, lat REAL, lng REAL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS chat_messages (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      role       TEXT NOT NULL,
      content    TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_msg_session ON chat_messages(session_id);
    CREATE INDEX IF NOT EXISTS idx_searches_city ON searches(city);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  `);
  save();
}

function query(sql, params = []) {
  const stmt = db.prepare(sql);
  const rows = [];
  stmt.bind(params);
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function run(sql, params = []) {
  db.run(sql, params);
  save();
}

// ── Users ─────────────────────────────────────────────────────
function createUser({ name, email, password }) {
  run('INSERT INTO users (name, email, password) VALUES (?,?,?)', [name, email, password]);
  return query('SELECT id, name, email FROM users WHERE email=?', [email])[0];
}
function getUserByEmail(email) {
  return query('SELECT * FROM users WHERE email=?', [email])[0] || null;
}
function getUserById(id) {
  return query('SELECT id, name, email, created_at FROM users WHERE id=?', [id])[0] || null;
}

// ── Searches ──────────────────────────────────────────────────
function saveSearch({ userId, query: q, lat, lng, city, country }) {
  run('INSERT INTO searches (user_id,query,lat,lng,city,country) VALUES (?,?,?,?,?,?)',
    [userId||null, q, lat||null, lng||null, city||null, country||null]);
}
function getRecentSearches(limit = 20) {
  return query('SELECT * FROM searches ORDER BY created_at DESC LIMIT ?', [limit]);
}
function getTopCities(limit = 10) {
  return query(`SELECT city, COUNT(*) as count FROM searches WHERE city IS NOT NULL GROUP BY city ORDER BY count DESC LIMIT ?`, [limit]);
}

// ── Sessions ──────────────────────────────────────────────────
function upsertSession({ sessionId, userId, city, lat, lng }) {
  run(`INSERT INTO chat_sessions (session_id,user_id,city,lat,lng) VALUES (?,?,?,?,?)
       ON CONFLICT(session_id) DO UPDATE SET city=excluded.city,lat=excluded.lat,lng=excluded.lng,updated_at=datetime('now')`,
    [sessionId, userId||null, city||null, lat||null, lng||null]);
}
function getSession(sid) {
  return query('SELECT * FROM chat_sessions WHERE session_id=?', [sid])[0] || null;
}

// ── Messages ──────────────────────────────────────────────────
function saveMessage({ sessionId, role, content }) {
  run('INSERT INTO chat_messages (session_id,role,content) VALUES (?,?,?)', [sessionId, role, content]);
}
function getMessages(sessionId, limit = 20) {
  return query('SELECT role,content FROM chat_messages WHERE session_id=? ORDER BY created_at DESC LIMIT ?', [sessionId, limit]).reverse();
}

// ── Stats ─────────────────────────────────────────────────────
function getStats() {
  return {
    totalUsers:    query('SELECT COUNT(*) as n FROM users')[0]?.n || 0,
    totalSearches: query('SELECT COUNT(*) as n FROM searches')[0]?.n || 0,
    totalSessions: query('SELECT COUNT(*) as n FROM chat_sessions')[0]?.n || 0,
    totalMessages: query('SELECT COUNT(*) as n FROM chat_messages')[0]?.n || 0,
    topCities:     getTopCities(5),
  };
}

module.exports = {
  getDB, save,
  createUser, getUserByEmail, getUserById,
  saveSearch, getRecentSearches, getTopCities,
  upsertSession, getSession,
  saveMessage, getMessages,
  getStats,
};
