# Kick Companion (Web)

Mobil uyumlu Kick.com companion web sitesi.

## Özellikler
- Canlı HLS player (düşük latency)
- Gerçek zamanlı chat
- 7TV + BTTV emote
- Favoriler + son izlenenler
- Mobil öncelikli + PWA (Ana ekrana eklenebilir)
- Responsive

## Termux ile çalıştırma

```bash
pkg update && pkg install nodejs git
git clone https://github.com/Meisterno/kick-companion-web.git
cd kick-companion-web
npm install
npm run dev -- --host
```

Çıkan adresi (genelde http://0.0.0.0:5173) tarayıcıda aç.  
Aynı telefonda `http://127.0.0.1:5173` yazarak da açabilirsin.

## Build (host için)
```bash
npm run build
```
`dist/` klasörünü Vercel / Netlify / Cloudflare Pages'e at.
