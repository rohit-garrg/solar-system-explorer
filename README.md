# Solar System Explorer

An interactive 3D solar system that kids (ages 4-8) can touch, explore, and learn from. Built with React + Three.js (React Three Fiber).

## Features

- **22 explorable worlds**: Sun, 9 planets, 12 named moons
- **Touch-friendly**: pinch to zoom, drag to rotate, tap to explore
- **Fact cards**: age-appropriate facts about each body
- **Time control**: 0.1x to 20x speed with play/pause
- **Spacecraft mode**: fly between planets with a rocket
- **Size comparison**: line up planets by size
- **Asteroid belt** and **comets** (Halley's and Hale-Bopp)
- **Twinkling starfield** with constellations
- **Postcard from Space**: screenshot with decorative frame
- **Discovery tracker**: explore all 22 worlds (persisted to localStorage)
- **Opt-in ambient audio** with per-planet tones
- **Adaptive performance**: automatically reduces quality on slower devices
- **Graceful degradation**: works without textures, handles WebGL context loss

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| React | 19.x | UI framework |
| Vite | 7.x | Build tool |
| Three.js | 0.162.0 | 3D rendering |
| @react-three/fiber | 8.15.0 | React wrapper for Three.js |
| @react-three/drei | 9.99.0 | Three.js helpers |
| Zustand | 4.5.0 | State management |
| Tailwind CSS | 3.4.1 | UI styling |
| Howler.js | 2.2.4 | Audio playback |

## Setup

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Textures (Optional)

The app works without textures (uses fallback colors). For full visual quality, download textures from [Solar System Scope](https://www.solarsystemscope.com/textures/) and place them in `public/textures/`:

```
public/textures/
  sun.jpg
  mercury.jpg
  venus.jpg
  venus-clouds.jpg
  earth/
    surface.jpg
    clouds.png
    night.jpg
  mars.jpg
  jupiter.jpg
  saturn.jpg
  saturn-ring.png
  uranus.jpg
  neptune.jpg
  pluto.jpg
  moons/
    moon.jpg, io.jpg, europa.jpg, ganymede.jpg, callisto.jpg,
    titan.jpg, enceladus.jpg, titania.jpg, oberon.jpg,
    triton.jpg, charon.jpg, phobos.jpg, deimos.jpg
```

## Audio (Optional)

Place audio files in `public/audio/`. The app degrades gracefully without them.

```
public/audio/
  ambient-space.mp3
  planet-tones/
    mercury.mp3 through pluto.mp3
  sfx/
    whoosh.mp3, arrive.mp3, click.mp3
```

Source from [Freesound](https://freesound.org), [Pixabay Sound Effects](https://pixabay.com/sound-effects/), or generate with [jsfxr](https://jsfxr.frozenfrog.com/).

## Iframe Embedding

```html
<iframe
  src="https://solar.rohitgarrg.com"
  width="100%"
  height="600"
  style="min-height: 500px; border: none;"
  allow="autoplay"
  title="Solar System Explorer"
></iframe>
```

Set this CSP header on the hosting server:

```
Content-Security-Policy: frame-ancestors 'self' https://rohitgarrg.com https://*.rohitgarrg.com;
```

## Keyboard Shortcuts

| Key | Action |
|---|---|
| Space | Play/Pause |
| Arrow Up | Increase time speed |
| Arrow Down | Decrease time speed |

## Performance

The app monitors FPS and automatically adapts quality:
- **High**: 500 asteroids, 1800 dim stars, 64-segment spheres
- **Medium**: 200 asteroids, 1000 dim stars, 32-segment spheres
- **Low**: 100 asteroids, 500 dim stars, 16-segment spheres, no comet tails

Target: 60fps on modern desktop, 30+ fps on mobile Safari (iPhone 12+, iPad Air 4+).

## Architecture

- `src/utils/scaleConfig.js` -- single source of truth for all sizes, distances, speeds
- `src/stores/useStore.js` -- Zustand state (time, selection, modes, audio, discovery)
- `src/utils/orbitMath.js` -- circular and elliptical orbit computation
- `src/components/` -- Three.js components (inside Canvas)
- `src/components/ui/` -- HTML overlay components (outside Canvas)
- `src/hooks/` -- audio, camera animation, performance monitoring
- `src/data/` -- JSON data (facts, planets, moons, comets, constellations)
