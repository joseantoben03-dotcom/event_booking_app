const express = require('express');
const passport = require('../config/passport');
const { googleCallback, me, logout } = require('../controllers/authController');
const { ensureAuthenticated } = require('../middleware/authMiddleware');

const router = express.Router();

// Start Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

// Google OAuth callback
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/auth/google/failure' }),
  googleCallback
);

// Failure fallback (email not registered, etc.)
router.get('/google/failure', (req, res) => {
  const reason = encodeURIComponent('Your email is not registered. Contact admin.');
  res.redirect(`${process.env.FRONTEND_URL}/login?error=${reason}`);
});

router.get('/me', ensureAuthenticated, me);
router.post('/logout', ensureAuthenticated, logout);

module.exports = router;
