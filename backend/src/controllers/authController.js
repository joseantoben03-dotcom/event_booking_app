const jwt = require('jsonwebtoken');
require('dotenv').config();

function issueToken(user) {
  return jwt.sign({ id: user.id, email: user.email, designation: user.designation }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

// GET /auth/google/callback
function googleCallback(req, res) {
  // passport (session: false) puts the user on req.user when successful.
  if (!req.user) {
    const reason = encodeURIComponent('Your email is not registered. Contact admin.');
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=${reason}`);
  }

  const token = issueToken(req.user);
  return res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
}

// GET /auth/me
async function me(req, res) {
  const u = req.user;
  return res.json({
    id: u.id,
    name: u.name,
    email: u.email,
    contactno: u.contactno,
    designation: u.designation,
    department: u.department,
    avatar_url: u.avatar_url,
    venue_id: u.venue_id,
  });
}

// POST /auth/logout (stateless JWT: client just discards the token)
function logout(req, res) {
  return res.json({ message: 'Logged out.' });
}

module.exports = { googleCallback, me, logout, issueToken };
