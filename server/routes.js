const express = require('express');
const { sendMessage } = require('./controllers/mailController.js');

const router = express.Router();

const api = route => `/api${route}`;

router.post(api('/message/send'), sendMessage);

router.get('/admin', (req, res) => {
    // TODO: Authentication and login view
    res.render('index', { title: 'Relevant Builders Website Admin' });
});

module.exports = router;
