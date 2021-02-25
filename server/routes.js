const express = require('express');
const path = require('path');
const { readJsonSync } = require('fs-extra');
const { authenticate, ensureIsLoggedIn } = require('./auth.js');
const { sendMessage } = require('./controllers/mailController.js');
const { uploadImage, resizeImage } = require('./controllers/photosController.js');
const { publish } = require('./controllers/publishController.js');
const { appRoot, publicRoot } = require('./config.js');
const content = readJsonSync(path.resolve(__dirname, './admin/content.json'));

const router = express.Router();

const api = (route = '') => `/api${route}`;
const admin = (route = '') => `/admin${route}`;

const adminRoot = `${appRoot}/admin`;

router.post(api('/message/send'), sendMessage);

router.post(api('/image/upload'), ensureIsLoggedIn(), uploadImage, resizeImage);

router.post(api('/publish'), ensureIsLoggedIn(), publish);

router.get(api('/content'), ensureIsLoggedIn(), (req, res) => res.status(200).json(content));

// Authentication routes
router.get(admin('/auth'), authenticate());
router.get(admin('/auth/return'), authenticate({ failureRedirect: adminRoot }), (req, res) => res.redirect(adminRoot));

router.get(admin(), (req, res) => {
    if (req.user) {
        res.render('index', { title: 'Relevant Builders Website Admin', publicRoot, content });
    } else {
        res.render('login', { title: 'Sign In: Relevant Builders Website Admin' });
    }
});

module.exports = router;
