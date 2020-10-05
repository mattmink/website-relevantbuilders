const express = require('express');
const { sendMessage } = require('./controllers/mailController.js');

const router = express.Router();

// /api/message/send
router.post('/message/send', sendMessage);

module.exports = router;
