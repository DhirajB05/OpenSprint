<div align="center">

# 🔥 GitHub Roast Machine

**AI-powered GitHub profile roaster with retro UI, auto-generated memes & shareable roast cards**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FDhirajB05%2FOpenSprint&root-directory=Round%2001/github-roast)

![Landing Page](./screenshots/landing.png)

Drop any GitHub username and watch AI brutally (but lovingly) tear apart your commit history, empty repos, and questionable tech choices.

</div>

---

## ✨ Features

- 🔥 **AI-Powered Roasts** — 3 modes: Friendly, Sarcastic, and Savage
- 🎭 **Auto-Generated Memes** — AI picks the perfect viral meme templates and writes custom captions based on your roast
- 🃏 **Shareable Roast Cards** — Download and share your roast as a styled card
- ⚡ **Smart Caching** — In-memory cache (24h TTL) prevents duplicate API calls, with optional Vercel KV (Redis) support
- 📊 **Career Score** — AI rates your GitHub career out of 100
- 🏷️ **Developer Archetypes** — Get classified as "The Eternal Beginner", "Fork Collector", "Tutorial Hoarder" and more
- 🐦 **Social Sharing** — One-click share to X (Twitter) and LinkedIn

---

## 📸 Screenshots

### Roast Results & Career Score
![Results](./screenshots/results.png)

### Auto-Generated Memes
![Memes](./screenshots/memes.png)

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite 7, React Router |
| **Backend** | Express.js (Node.js) |
| **AI** | Groq API (Llama 3.1 8B Instant) |
| **Caching** | In-memory (default) / Vercel KV Redis (production) |
| **Styling** | Vanilla CSS with retro design system |
| **Deployment** | Vercel |

---

## 🚀 Quick Start (Local Development)
```

Open **http://localhost:5173** and roast away!

---

## 📁 Project Structure

```
github-roast/
├── src/
│   ├── pages/
│   │   ├── Landing.jsx     # Home page with username input
│   │   ├── Loading.jsx     # Retro terminal loading animation
│   │   ├── Results.jsx     # Roast results + inline memes
│   │   └── RoastCard.jsx   # Downloadable roast card
│   ├── App.jsx             # Router setup
│   └── index.css           # Full retro design system
├── server/
│   ├── index.js            # Express server
│   ├── routes/
│   │   ├── roast.js        # Groq AI roast generation + caching
│   │   ├── meme.js         # Auto meme picker + caption gen
│   │   └── github.js       # GitHub profile data fetcher
│   └── .env.example        # Environment template
├── screenshots/            # README mockup images
└── package.json
```

---
