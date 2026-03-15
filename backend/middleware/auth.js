const { parseToken } = require('../controllers/authController');
const db = require('../models/db');

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer '))
    return res.status(401).json({ error: 'No token provided' });

  const token  = authHeader.split(' ')[1];
  const userId = parseToken(token);
  if (!userId) return res.status(401).json({ error: 'Invalid token' });

  await db.getDB();
  const user = db.getUserById(userId);
  if (!user) return res.status(401).json({ error: 'User not found' });

  req.user   = user;
  req.userId = user.id;
  next();
}

module.exports = authMiddleware;
