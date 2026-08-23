# Kick Companion Web v1.1

Mobile-first Kick.com companion — player + real-time chat + emotes.

## Features

- **HLS low-latency player** (hls.js)
- **Real-time chat** via Kick Pusher WebSocket
- **Emotes**: Kick native `[emote:id:name]` + 7TV + BTTV
- Favorites & recent streams (localStorage)
- Settings page (latency, chat limit, timestamps…)
- Dark theme, PWA-ready, works great on Android browser / Termux

## Quick start (Termux / phone)

```bash
cd ~
rm -rf kick-companion-web
git clone https://github.com/Meisterno/kick-companion-web.git
cd kick-companion-web
npm install
npm run dev -- --host
```

Open in Chrome: `http://127.0.0.1:5173`

## Update

```bash
cd ~/kick-companion-web
git pull
npm install
npm run dev -- --host
```

## Pages

| Route | Description |
|-------|-------------|
| `/` | Home — search, favorites, featured |
| `/channel/:slug` | Player + live chat |
| `/settings` | App settings |

## Stack

Vite + React 19 + TypeScript + hls.js + react-router-dom
