const db   = require('../models/db');
const crypto = require('crypto');

// Simple SHA256 hash — no native modules needed (no bcrypt issues on Windows)
function hashPassword(password) {
  return crypto.createHash('sha256').update(password + 'locai_salt_2025').digest('hex');
}

// Simple token — base64 of userId + timestamp + secret
function makeToken(userId) {
  const payload = `${userId}:${Date.now()}:locai_secret_key_2025`;
  return Buffer.from(payload).toString('base64');
}
function parseToken(token) {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const [userId] = decoded.split(':');
    return parseInt(userId);
  } catch { return null; }
}

async function register(req, res) {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'Name, email and password are required' });
  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters' });

  try {
    await db.getDB();
    const existing = db.getUserByEmail(email);
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const user  = db.createUser({ name, email, password: hashPassword(password) });
    const token = makeToken(user.id);
    res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
}

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required' });

  try {
    await db.getDB();
    const user = db.getUserByEmail(email);
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const hashed = hashPassword(password);
    if (user.password !== hashed)
      return res.status(401).json({ error: 'Invalid email or password' });

    const token = makeToken(user.id);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
}

async function me(req, res) {
  res.json({ user: req.user });
}

module.exports = { register, login, me, parseToken };
