const express = require('express');
const router  = express.Router();
const { chat, getHistory } = require('../controllers/aiController');

// POST /api/ai/chat        — send a message, get AI reply
// GET  /api/ai/history/:id — get full chat history for a session

router.post('/chat',           chat);
router.get('/history/:sessionId', getHistory);

module.exports = router;
