const jwt = require('jsonwebtoken');
const { User } = require('../models');
require('dotenv').config();

// Verifies the JWT issued at login and attaches the DB user to req.user.
// Also defensively re-checks that the email still exists in `users`.
async function ensureAuthenticated(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized', details: 'Missing token.' });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(payload.id);

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized', details: 'Your email is not registered. Contact admin.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized', details: 'Invalid or expired token.' });
  }
}

// Restrict a route to a set of designations.
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const designation = typeof req.user.designation === 'string' ? req.user.designation.trim().toLowerCase() : '';
    if (!roles.includes(designation)) {
      return res.status(403).json({ error: 'Forbidden', details: `Requires role: ${roles.join(' or ')}` });
    }
    next();
  };
}

module.exports = { ensureAuthenticated, requireRole };
