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

// Role-based access control middleware
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}

// Request logging middleware
function logAuth(req, res, next) {
  console.log(`[AUTH] ${new Date().toISOString()} - ${req.method} ${req.path} - User: ${req.userId || 'Anonymous'}`);
  next();
}

module.exports = authMiddleware;
module.exports.authorize = authorize;
module.exports.logAuth = logAuth;
