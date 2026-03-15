require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const rateLimit = require('express-rate-limit');
const path      = require('path');

const aiRoutes       = require('./routes/ai');
const locationRoutes = require('./routes/location');
const authRoutes     = require('./routes/auth');

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/', rateLimit({ windowMs: 60000, max: 100 }));

// Serve frontend
const FRONTEND = path.join(__dirname, '..', 'frontend', 'public');
app.use(express.static(FRONTEND));

// Routes
app.use('/api/auth',     authRoutes);
app.use('/api/ai',       aiRoutes);
app.use('/api/location', locationRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok', service: 'LocAI v3',
    groqKey: process.env.GROQ_API_KEY ? '✅' : '❌ MISSING',
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(FRONTEND, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🌐 LocAI v3 → http://localhost:${PORT}`);
  console.log(`   Groq Key: ${process.env.GROQ_API_KEY ? '✅ configured' : '❌ add GROQ_API_KEY to .env'}\n`);
});
