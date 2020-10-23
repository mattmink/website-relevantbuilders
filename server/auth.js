const passport = require('passport');
const expressSession = require('express-session');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const { auth: {
    validUsers,
    sessionSecret,
    googleClientId,
    googleClientSecret
}} = require('./config');
const router = require('./routes');

const admin = (route = '') => `/admin${route}`;
const googleConfig = {
    clientID: googleClientId,
    clientSecret: googleClientSecret,
    callbackURL: admin('/auth/return')
};

passport.use(new GoogleStrategy(googleConfig, (_, __, profile, cb) => {
    const user = profile._json;
    if (!validUsers.includes(user.email)) {
        cb(null, null, { message: 'Not a valid user' });
        return;
    }
    cb(null, profile._json)
}));

passport.serializeUser((user, cb) => cb(null, user));
passport.deserializeUser((user, cb) => cb(null, user));

// Authentication routes
router.get(admin('/auth'), passport.authenticate('google', { scope: 'https://www.googleapis.com/auth/userinfo.email' }));
router.get(
    admin('/auth/return'),
    passport.authenticate('google', {
        scope: 'https://www.googleapis.com/auth/plus.login',
        failureRedirect: admin(),
    }),
    (req, res) => res.redirect(admin()));

module.exports = {
    init(app) {
        app.use(expressSession({
            secret: sessionSecret,
            resave: true,
            saveUninitialized: true
        }));
        app.use(passport.initialize());
        app.use(passport.session());
    },
};
