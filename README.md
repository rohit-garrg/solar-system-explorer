# Solar System Explorer

An interactive 3D solar system for kids ages 4-8. Touch, explore, and learn about planets, moons, and more.

Built with React + Three.js (React Three Fiber).

## Tech Stack

- **React 19** + **Vite** — fast dev and builds
- **Three.js 0.162** via **@react-three/fiber 8.x** + **@react-three/drei 9.x** — declarative 3D
- **Zustand** — lightweight state management
- **Tailwind CSS v3** — UI overlay styling
- **Howler.js** — audio playback

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Textures

Before running, download planet textures from [Solar System Scope](https://www.solarsystemscope.com/textures/) and place them in `public/textures/`. The app works without textures (shows fallback colors), but textures make it beautiful.

## Build

```bash
npm run build
npm run preview
```

Static output goes to `dist/` — deploy anywhere that serves static files.
