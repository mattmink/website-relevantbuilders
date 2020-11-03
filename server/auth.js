const passport = require('passport');
const expressSession = require('express-session');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const { auth: {
    validUsers,
    sessionSecret,
    googleClientId,
    googleClientSecret
}, appRoot } = require('./config');

const googleConfig = {
    clientID: googleClientId,
    clientSecret: googleClientSecret,
    callbackURL: `${appRoot}/admin/auth/return`,
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
    authenticate({ failureRedirect } = {}) {
        return passport.authenticate('google', {
            failureRedirect,
            scope: 'https://www.googleapis.com/auth/userinfo.email',
        });
    },
    ensureIsLoggedIn(redirectTo) {
        return (req, res, next) => {
            if (!req.isAuthenticated || !req.isAuthenticated()) {
                if (redirectTo) return res.redirect(redirectTo);
                return res.sendStatus(403);
            }
            next();
        }
    }
};
