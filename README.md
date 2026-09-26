# Ambient Architect

Minimal web app to mix nature, city, and music textures into a personal soundscape.

## Live demo

[sounds-iota.vercel.app](https://sounds-iota.vercel.app/)

## Features

- **Mixer** — play several sounds at once with volume, band filter, and speed
- **Wind creator** — layered procedural wind with per-track controls (saved in mixes)
- **Snapshots** — save / load multiple local mixes
- **Share** — copy a `?mix=` link, or import / export mixes as JSON
- **Moods** — curated soundscapes (Focus, Sleep, Forest, …)
- **Random** — generate a balanced mix (volumes + Wind params)
- **Sleep timer** — gentle 20s fade-out
- **Music** — Freesound when `VITE_API_KEY` is set, otherwise local piano library
- **Paulstretch** — optional texture stretch on the Music player
- **PWA** — installable; local MP3s cached for offline replay
- **Themes** — calming palettes

## Stack

- React + Vite
- Web Audio API
- [Paulstretch](https://www.npmjs.com/package/paulstretch)
- LocalForage (snapshots + audio cache)
- vite-plugin-pwa
- Deployed on Vercel

## Setup

```bash
git clone <your-repo-url>
cd sounds
npm install
cp .env.example .env   # optional: VITE_API_KEY for Freesound music
npm run dev
```

Open `http://localhost:5173`.

## Usage

1. Tap icons to play sounds  
2. Adjust sliders in the active mix dock  
3. Save, load moods, share, or set a sleep timer from the bottom bar  

## Roadmap

See [ROADMAP.md](./ROADMAP.md).

## License

MIT

## Sound sources

- [Orange Free Sounds](https://orangefreesounds.com/sound-effects/)
- [Freesound](https://freesound.org/) — [API auth docs](https://freesound.org/docs/api/authentication.html)
