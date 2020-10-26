const express = require('express');
const { authenticate, ensureIsLoggedIn } = require('./auth.js');
const { sendMessage } = require('./controllers/mailController.js');
const { uploadImage } = require('./controllers/photosController.js');

const router = express.Router();

const api = (route = '') => `/api${route}`;
const admin = (route = '') => `/admin${route}`;

router.post(api('/message/send'), sendMessage);

router.post(api('/image/upload'), ensureIsLoggedIn(), uploadImage);

// Authentication routes
router.get(admin('/auth'), authenticate());
router.get(admin('/auth/return'), authenticate({ failureRedirect: admin() }), (req, res) => res.redirect(admin()));

router.get(admin(), (req, res) => {
    if (req.user) {
        res.render('index', { title: 'Relevant Builders Website Admin' });
    } else {
        res.render('login', { title: 'Sign In: Relevant Builders Website Admin' });
    }
});

module.exports = router;
