const express = require('express');
const { sendMessage } = require('./controllers/mailController.js');

const router = express.Router();

// /api/message/send
router.post('/message/send', sendMessage);
router.get('/hello', (req, res) => res.status(200).send(process.env.MAILER_HOST));

module.exports = router;
