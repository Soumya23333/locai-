const fetch = require('node-fetch');
const db    = require('../models/db');

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

async function chat(req, res) {
  const { message, sessionId, city, lat, lng } = req.body;

  if (!message || !sessionId)
    return res.status(400).json({ error: 'message and sessionId are required' });

  if (!process.env.GROQ_API_KEY)
    return res.status(500).json({ error: 'GROQ_API_KEY not set in .env' });

  try {
    await db.getDB();
    db.upsertSession({ sessionId, city, lat, lng });
    db.saveMessage({ sessionId, role: 'user', content: message });

    const history = db.getMessages(sessionId, 10);

    const locationCtx = lat && lng
      ? `The user is at ${city || 'unknown'} (lat:${parseFloat(lat).toFixed(4)}, lng:${parseFloat(lng).toFixed(4)}).`
      : city ? `The user is in ${city}.` : 'Location not shared yet.';

    const messages = [
      { role: 'system', content: `You are LocAI, a friendly expert AI travel and local guide. ${locationCtx} Help with food, hotels, attractions, transport, ATMs, hospitals. Be warm, specific, concise. Use emojis naturally.` },
      ...history.map(m => ({ role: m.role, content: m.content })),
    ];

    const response = await fetch(GROQ_URL, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model:       'llama-3.3-70b-versatile',
        messages,
        max_tokens:  800,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Groq error:', err);
      return res.status(502).json({ error: 'AI error', detail: err });
    }

    const data  = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'Try again!';

    db.saveMessage({ sessionId, role: 'assistant', content: reply });
    res.json({ reply, sessionId });

  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
}

async function getHistory(req, res) {
  const { sessionId } = req.params;
  if (!sessionId) return res.status(400).json({ error: 'sessionId required' });
  try {
    await db.getDB();
    res.json({ session: db.getSession(sessionId), messages: db.getMessages(sessionId, 50) });
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch history' });
  }
}

module.exports = { chat, getHistory };