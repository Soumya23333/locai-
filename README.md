# 🌐 LocAI — AI Location Agent

A full-stack AI-powered location guide that helps you explore any city in the world. Ask about food, hotels, tourist spots, transport, hospitals and more — with real-time maps, live weather, and nearby places.

![LocAI Screenshot](docs/screenshot.png)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🤖 **AI Chat** | Powered by Claude (Anthropic) — answers anything about your location |
| 🗺️ **Live Map** | OpenStreetMap embed with your exact pin |
| ☁️ **Live Weather** | Real-time temperature, humidity, wind via Open-Meteo (free, no key) |
| 📍 **Nearby Places** | Restaurants, ATMs, hospitals, hotels fetched from OpenStreetMap |
| 🏨 **Hotel Finder** | Auto-detected hotels near your location |
| 🍽️ **Food Guide** | Restaurants, cafes, bakeries nearby |
| 💾 **Database** | SQLite — saves search history & chat sessions |
| 📊 **Stats** | Total searches, sessions, and top cities dashboard |

---

## 🗂️ Project Structure

```
locai/
├── backend/                  # Node.js + Express API
│   ├── controllers/
│   │   ├── aiController.js       # Claude AI chat logic
│   │   └── locationController.js # Geocoding, weather, places
│   ├── models/
│   │   └── db.js                 # SQLite database (better-sqlite3)
│   ├── routes/
│   │   ├── ai.js                 # /api/ai routes
│   │   └── location.js           # /api/location routes
│   ├── server.js                 # Express app entry point
│   ├── package.json
│   └── .env.example              # Environment variable template
│
├── frontend/
│   └── public/
│       └── index.html            # Single-page frontend (vanilla JS)
│
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/locai.git
cd locai
```

### 2. Set up the backend

```bash
cd backend
npm install
```

### 3. Add your API key

```bash
cp .env.example .env
```

Open `.env` and add your Anthropic API key:

```env
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxx
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

> Get your free API key at → https://console.anthropic.com/

### 4. Start the backend

```bash
npm run dev
```

You should see:
```
🌐 LocAI Backend running on http://localhost:3001
   Health:   http://localhost:3001/api/health
   AI Key:   ✅ Configured
```

### 5. Open the frontend

Just open `frontend/public/index.html` in your browser.

> **Tip:** For GPS to work, use a local server instead of opening the file directly:
> ```bash
> npx serve frontend/public -p 3000
> ```
> Then visit http://localhost:3000

---

## 🔌 API Endpoints

### AI
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/ai/chat` | Send message, get AI reply |
| `GET` | `/api/ai/history/:sessionId` | Get chat history |

**POST /api/ai/chat body:**
```json
{
  "message": "Best food here?",
  "sessionId": "uuid-here",
  "city": "Bhubaneswar",
  "lat": 20.2961,
  "lng": 85.8245
}
```

### Location
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/location/search?q=Mumbai` | Search city by name |
| `GET` | `/api/location/reverse?lat=20.29&lng=85.82` | Coordinates → city name |
| `GET` | `/api/location/nearby?lat=20.29&lng=85.82` | Nearby places |
| `GET` | `/api/location/weather?lat=20.29&lng=85.82` | Live weather |
| `GET` | `/api/location/stats` | DB stats (searches, sessions) |
| `GET` | `/api/health` | Server health check |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Vanilla HTML, CSS, JavaScript |
| **Backend** | Node.js, Express.js |
| **Database** | SQLite via `sql.js` (pure JS — no build tools needed) |
| **AI** | Anthropic Claude API (`claude-sonnet-4-20250514`) |
| **Maps** | OpenStreetMap (free, no key) |
| **Weather** | Open-Meteo (free, no key) |
| **Geocoding** | Nominatim / OpenStreetMap (free, no key) |
| **Places** | Overpass API / OpenStreetMap (free, no key) |

---

## 🌍 Deployment

### Deploy Backend to Render (free)

1. Push your code to GitHub
2. Go to https://render.com → New Web Service
3. Connect your GitHub repo
4. Set:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Add environment variable: `ANTHROPIC_API_KEY`
6. Deploy!

### Deploy Frontend to GitHub Pages / Netlify

1. Update `API` in `frontend/public/index.html`:
   ```js
   const API = 'https://your-render-app.onrender.com/api';
   ```
2. Drag & drop `frontend/public/` to https://app.netlify.com/drop

---

## 📦 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | ✅ Yes | Your Anthropic Claude API key |
| `PORT` | No | Server port (default: 3001) |
| `NODE_ENV` | No | `development` or `production` |
| `FRONTEND_URL` | No | Frontend URL for CORS (default: localhost:3000) |

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

## 🙏 Credits

Built with [Claude AI](https://anthropic.com) · [OpenStreetMap](https://openstreetmap.org) · [Open-Meteo](https://open-meteo.com)
