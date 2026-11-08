# ✨ Charlotte's GemBook — Magical Bedtime Flipbook PWA

A modern, landscape-tablet bedtime picture book Progressive Web Application (PWA) built for **7-year-old Charlotte**, featuring realistic 3D two-page flipbook physics, custom storybook illustrations, and a calm, slow-paced Australian female voiceover.

## 🌟 Key Features

- **Landscape Tablet 2-Page Flipbook (`react-pageflip`)**:
  - Realistic page-curling physics when flicked or swiped across the page corners on a Samsung Galaxy Tab.
  - Displays 2 pages per spread (5 story spreads = 10 illustrated pages + Frontispiece/Cover spread + Goodnight spread).
- **Calm Australian Female Bedtime Voiceover (`en-AU-NatashaNeural`)**:
  - Pre-generated high-definition neural TTS `.mp3` audio files bundled directly in `public/audio/` for instant, zero-latency offline playback, with automatic Web Speech API (`en-AU` / `en-GB`) fallback.
  - **Synchronized Autoplay**: Reads the left page aloud (with a soft golden reading glow), pauses for a calm bedtime breath, reads the right page aloud, and automatically turns to the next two-page spread.
- **One-Tap Fullscreen + Autoplay Launch**:
  - Tapping a book cover on the landing page automatically requests **Fullscreen API** (`document.documentElement.requestFullscreen()`), locks landscape orientation where supported, opens the flipbook to Page 1, and starts voiceover autoplay.
- **Bedtime Comfort & Tablet Enhancements**:
  - **Installable PWA + Offline Service Worker (`public/sw.js`)**: Caches all illustrations and voiceover MP3s for offline reading and fullscreen home-screen launch on Android/Galaxy Tab.
  - **Screen Wake Lock API (`navigator.wakeLock`)**: Prevents the Galaxy Tab screen from dimming or locking while Charlotte is listening hands-free, and releases the lock once the story finishes.
  - **Warm Bedtime Eye-Comfort Filter**: Adjustable warm amber night-light slider to reduce blue light at bedtime, plus an automatic sleep dimmer after Page 10.
  - **Procedural Lullaby Music Box & Page-Flip Rustle**: Built-in Web Audio API gentle music-box background pad and realistic paper-turn sound effects.
  - **Kid-Proof Touch Controls**: Auto-hiding HUD and a "Hold to Exit" library button while playing so accidental touches don't interrupt the story.

---

## 📖 Adding New Stories in the Codebase

1. **Add Story Data**: Add a new story entry to [`src/data/stories.ts`](src/data/stories.ts) with 10 pages, cover path, and audio paths.
2. **Add Illustrations**: Place cover and page artwork in `public/stories/<story-id>/`.
3. **Generate Australian Female Voiceover Audio**:
   Add the story segments to [`scripts/generate-audio.mjs`](scripts/generate-audio.mjs) and run:
   ```bash
   npm run generate-audio
   ```

---

## 🚀 Local Development & Deployment

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build production bundle
npm run build
```

### Deploying to Vercel
Import this GitHub repository into [Vercel](https://vercel.com/new) — zero configuration is required. Once deployed, open the production URL in **Chrome on your Samsung Galaxy Tab** and tap **"Install"** (or **Add to Home Screen**) for a full native-like bedtime storybook experience.
