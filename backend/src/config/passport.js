const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { User } = require('../models');
require('dotenv').config();

// NOTE: designation ('ap' | 'hod' | 'principal' | 'campus_manager') must already
// exist in the users table. Google login NEVER creates a new user — it only
// authenticates emails that admins have pre-registered.
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails && profile.emails[0] && profile.emails[0].value;
        if (!email) return done(null, false, { message: 'No email returned by Google.' });

        const user = await User.findOne({ where: { email: email.toLowerCase() } });

        if (!user) {
          // Not registered -> reject, do not auto-create.
          return done(null, false, { message: 'NOT_REGISTERED', email });
        }

        const updates = {};
        if (!user.google_id) updates.google_id = profile.id;
        if (profile.displayName && profile.displayName !== user.name) updates.name = user.name; // keep institutional name
        if (profile.photos && profile.photos[0] && profile.photos[0].value !== user.avatar_url) {
          updates.avatar_url = profile.photos[0].value;
        }
        if (Object.keys(updates).length > 0) {
          await user.update(updates);
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

module.exports = passport;
