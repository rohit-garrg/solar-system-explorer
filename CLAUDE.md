# Solar System Explorer — Project Spec (v2)

## What This Is

An interactive 3D solar system that kids (ages 4-8) can touch, explore, and learn from. Built with React + Three.js (React Three Fiber) for web. The web version will be embedded on rohitgarrg.com via iframe and must work standalone at its own URL too.

This is a learning project. The developer (Rohit) has no prior experience with React or Three.js. Every step should be explained, every file should have comments, and nothing should be assumed.

A future Phase 2 may port this to a native iPad app in SwiftUI + SceneKit. The data layer (JSON configs, facts) is designed to be reusable across platforms.

## Core Experience

Kids open the app and see the solar system floating in space. The Sun glows at the center. Planets orbit around it at different speeds. Stars twinkle in the background.

They can pinch to zoom, drag to rotate, and tap any celestial body to open a fact card with age-appropriate information. A time slider speeds up or slows down orbits. A spacecraft mode lets them "fly" between planets. Sound is opt-in via a button (browser autoplay policy).

## Technical Stack

| Choice | What | Why |
|--------|------|-----|
| Framework | React 18.2+ with Vite 5.x | Fast dev server, optimized builds |
| 3D Engine | Three.js 0.162.x via @react-three/fiber 8.x + @react-three/drei 9.x | Declarative 3D in React |
| Post-processing | @react-three/postprocessing 2.x | Bloom glow on Sun (used sparingly) |
| State | Zustand 4.x | Lightweight, works natively with R3F's render loop |
| Styling | Tailwind CSS 3.4.x (v3, NOT v4) | UI overlays only. Pin to v3 — the config system changed in v4 |
| Audio | Howler.js 2.2.x | Simple audio playback. Not spatial — just stereo/mono |
| Types | JSDoc type annotations in .js files | Lightweight type safety without full TypeScript migration |
| Package Manager | npm |  |
| Deployment | Static build, no backend |  |

**Version pinning is critical.** Three.js has breaking changes between minor versions. R3F v8 and v9 have API differences. Always install exact versions: `npm install three@0.162.0 @react-three/fiber@8.15.0 @react-three/drei@9.99.0`.

**React StrictMode:** Disable StrictMode in `main.jsx`. React 18's StrictMode double-invokes effects, which creates Three.js resources twice and causes memory leaks. This is a known R3F issue.

## What "Done" Looks Like

A polished, performant 3D solar system that:
1. Renders all 22 explorable celestial bodies (Sun, 9 planets, 12 named moons) with procedural colors and optional NASA textures
2. Supports touch gestures (pinch zoom, drag rotate, tap to select) and mouse
3. Shows animated orbits with adjustable time control (0.1x to 20x)
4. Displays age-appropriate fact cards on tap
5. Has a spacecraft fly-between-planets mode with discovery tracking
6. Includes opt-in ambient audio and per-planet tones
7. Runs at 60fps on modern desktop browsers, 30+ fps on mobile Safari (iPhone 12+, iPad Air 4+)
8. Is embeddable via iframe with responsive sizing
9. Gracefully degrades on low-end devices (fewer asteroids, no bloom)
10. Recovers from WebGL context loss and texture load failures

---

## Scale System (The Single Source of Truth)

This is the most important section of this spec. All sizes and distances are defined here. They live in `src/utils/scaleConfig.js` and are imported by every component that positions or sizes anything.

**Design principles:**
- Sun is large and dominant but not so large it obscures inner planets
- All planets are tappable on mobile (minimum visual radius ~0.3 scene units at default zoom)
- Distances use a power-curve compression: inner planets are spaced tighter, outer planets wider
- Relative size ordering is preserved (Jupiter > Saturn > Uranus > Neptune > Earth > Venus > Mars > Mercury > Pluto)
- Absolute sizes are wildly exaggerated compared to reality — this is for kids, not astronomers

### Planet Radii (scene units)

| Body | Radius | Notes |
|------|--------|-------|
| Sun | 8.0 | Emissive, partially off-screen at default zoom |
| Mercury | 0.38 | Minimum tappable size |
| Venus | 0.72 | |
| Earth | 0.75 | Reference body for comparisons |
| Mars | 0.53 | |
| Jupiter | 2.0 | Gas giants are noticeably larger |
| Saturn | 1.7 | Ring system adds visual width |
| Uranus | 1.1 | |
| Neptune | 1.05 | |
| Pluto | 0.3 | Smallest, at the minimum tappable threshold |

### Orbital Distances from Sun (scene units, center-to-center)

| Body | Distance | Spacing gap from previous |
|------|----------|---------------------------|
| Mercury | 18 | — |
| Venus | 23 | 5 |
| Earth | 28 | 5 |
| Mars | 34 | 6 |
| *Asteroid Belt center* | 42 | 8 |
| Jupiter | 52 | 10 |
| Saturn | 68 | 16 |
| Uranus | 84 | 16 |
| Neptune | 100 | 16 |
| Pluto | 112 | 12 |

### Orbital Speeds (radians per second at 1x time speed)

Relative ordering preserved. Mercury is visibly fastest. Neptune barely moves.

| Body | Speed (rad/s) | Approximate orbit period at 1x |
|------|---------------|-------------------------------|
| Mercury | 0.25 | ~25 seconds |
| Venus | 0.18 | ~35 seconds |
| Earth | 0.12 | ~52 seconds |
| Mars | 0.08 | ~78 seconds |
| Jupiter | 0.04 | ~157 seconds |
| Saturn | 0.025 | ~251 seconds |
| Uranus | 0.015 | ~419 seconds |
| Neptune | 0.01 | ~628 seconds |
| Pluto | 0.008 | ~785 seconds |

### Rotation Speeds (radians per second, self-spin at 1x)

| Body | Speed | Notes |
|------|-------|-------|
| Sun | 0.02 | Slow, majestic |
| Mercury | 0.005 | Very slow rotation (tidally locked-ish) |
| Venus | -0.003 | Negative = retrograde (spins backwards!) |
| Earth | 0.15 | Visibly spinning |
| Mars | 0.14 | Similar to Earth |
| Jupiter | 0.35 | Fast spinner |
| Saturn | 0.32 | Fast spinner |
| Uranus | 0.25 | |
| Neptune | 0.27 | |
| Pluto | 0.02 | Slow |

### Axial Tilts (degrees)

| Body | Tilt | Notes |
|------|------|-------|
| Mercury | 0.03 | Basically upright |
| Venus | 177.4 | Nearly upside-down (retrograde) |
| Earth | 23.4 | The classic tilt |
| Mars | 25.2 | Similar to Earth |
| Jupiter | 3.1 | Nearly upright |
| Saturn | 26.7 | |
| Uranus | 97.8 | Rolling on its side — very distinctive |
| Neptune | 28.3 | |
| Pluto | 122.5 | Significant tilt |

### Moon Sizes and Orbits

Moons orbit their parent planet. They are rendered as children of the planet's `<group>`, so they inherit the planet's orbital position automatically (scene graph hierarchy, not manual position math).

| Moon | Parent | Radius | Orbit Distance | Orbit Speed (rad/s) |
|------|--------|--------|----------------|---------------------|
| Moon | Earth | 0.2 | 2.0 | 0.5 |
| Phobos | Mars | 0.08 | 1.0 | 1.2 |
| Deimos | Mars | 0.06 | 1.4 | 0.8 |
| Io | Jupiter | 0.18 | 3.5 | 0.6 |
| Europa | Jupiter | 0.16 | 4.2 | 0.45 |
| Ganymede | Jupiter | 0.22 | 5.0 | 0.3 |
| Callisto | Jupiter | 0.2 | 6.0 | 0.2 |
| Titan | Saturn | 0.22 | 3.8 | 0.35 |
| Enceladus | Saturn | 0.1 | 2.8 | 0.7 |
| Titania | Uranus | 0.14 | 2.5 | 0.4 |
| Oberon | Uranus | 0.13 | 3.2 | 0.3 |
| Triton | Neptune | 0.18 | 3.0 | -0.4 |
| Charon | Pluto | 0.15 | 1.2 | 0.25 |

**Total explorable bodies: 22** (1 Sun + 9 planets + 12 named moons + asteroid belt as non-selectable decoration)

The Discovery Tracker counts these 22.

### Hit Area Expansion

Small bodies need expanded invisible tap targets. For any body with visual radius < 0.5, render an invisible sphere with radius = max(visualRadius * 2.5, 0.5) for pointer events. This ensures tappability on mobile.

### Default Camera

- Position: `[0, 80, 120]` — elevated, angled down at roughly 35 degrees
- LookAt: `[0, 0, 0]` (the Sun)
- Near clip: 0.1, Far clip: 1000
- Zoom limits: min distance 5 (planet surface), max distance 200 (full system)

---

## Celestial Bodies: Visual Specifications

### Sun
- Mesh: `<sphere>` with radius 8.0, 64 segments
- Material: `MeshBasicMaterial` with color `#FDB813`, NO standard lighting (it IS the light)
- Glow: Bloom post-processing effect via `@react-three/postprocessing` `<Bloom>`, OR a second larger sphere with additive blending and 10% opacity orange
- Light: `<pointLight>` at position `[0,0,0]`, intensity 2.0, color white
- Texture: If NASA texture available, apply as `map` on a MeshBasicMaterial (NOT MeshStandardMaterial — the Sun is self-lit)

### Earth (Most Complex Planet)
- Base sphere: Surface texture
- Cloud layer: A second sphere at radius `earthRadius * 1.02`, with cloud texture, `transparent: true`, `opacity: 0.4`, rotating at 1.1x the surface rotation speed
- Night lights: **Requires a custom approach.** Use a third sphere at `earthRadius * 1.01` with the night texture as `emissiveMap`, and use `onBeforeCompile` to modify the shader so emission is masked by `dot(normal, sunDirection)`. Only the hemisphere facing away from the Sun shows city lights. If custom shaders are too complex for the current stage, skip night lights and add a TODO.

### Saturn
- Ring: Use `<ringGeometry args={[innerRadius, outerRadius, 64]}` where `innerRadius = 2.2` and `outerRadius = 3.8`
- **UV Fix (Critical):** Three.js RingGeometry generates radial UVs that distort textures. After creating the geometry, remap UVs manually:
```javascript
const geo = new THREE.RingGeometry(inner, outer, 64);
const pos = geo.attributes.position;
const uv = geo.attributes.uv;
for (let i = 0; i < pos.count; i++) {
  const x = pos.getX(i), y = pos.getY(i);
  const dist = Math.sqrt(x * x + y * y);
  uv.setXY(i, (dist - inner) / (outer - inner), 0.5);
}
```
- Material: `DoubleSide`, `transparent: true`, ring texture with alpha channel for Cassini division

### Venus
- Yellowish base texture for surface
- Cloud layer: Like Earth, a second sphere at 1.03x radius, with a Venus atmosphere texture (thick, featureless yellowish-white), opacity 0.7. Venus's atmosphere is its defining visual.

### Uranus
- Axial tilt: 97.8 degrees applied to the planet group, so moons orbit in the tilted plane too
- Optional faint ring system (much less prominent than Saturn)

### Other Planets
- Mercury: Gray, cratered texture. Smallest inner planet.
- Mars: Red-orange texture. Visible polar ice caps (lighter spots at poles on texture).
- Jupiter: Banded atmosphere texture. Great Red Spot visible. No animation on the spot — the texture handles it.
- Neptune: Deep blue texture. Storm spots visible in texture.
- Pluto: Yellowish-tan texture. Heart-shaped Tombaugh Regio feature visible.

### Asteroid Belt
- Position: Torus region between distance 38 and 46 (between Mars and Jupiter orbits)
- Render: `InstancedMesh` with 500 asteroids (reduce to 200 if FPS < 30)
- Each asteroid: `IcosahedronGeometry(1, 0)` scaled to random size between 0.03 and 0.12 scene units
- Random position within torus: random angle, random radius between 38-46, random Y offset between -1.5 and +1.5
- Random gray-brown color per instance via `instanceColor`
- Entire belt rotates slowly: 0.002 rad/s

### Comets
- 2 comets: Halley's Comet and Comet Hale-Bopp
- Use elliptical orbits (eccentricity > 0.9). The `orbitMath.js` utility handles both circular (planets) and elliptical (comets) orbits.
- Halley: semi-major axis 60, eccentricity 0.967, inclination 15 degrees
- Hale-Bopp: semi-major axis 80, eccentricity 0.95, inclination 20 degrees
- Comet body: small sphere (radius 0.15), icy blue-white color `#E8F4FD`
- Tail: A cone geometry (not particle system) pointing away from the Sun. Compute tail direction as `normalize(cometPosition - sunPosition)`. Tail length scales with `1 / distance_to_sun` (longer when closer). Max tail length: 5 scene units. Material: additive blending, gradient from white to transparent blue.

---

## Scene Graph Hierarchy

The 3D scene uses React Three Fiber `<group>` components to build a proper transform hierarchy. This is critical for moons (they inherit their parent planet's orbital position) and for axial tilt (applied once at the group level).

```
<Canvas>
  <Sun />
  <pointLight />
  <Starfield />
  <AsteroidBelt />

  {planets.map(planet =>
    <group>                          <!-- Orbital group: rotates around Y axis at orbital speed -->
      <group position={[distance, 0, 0]}>   <!-- Offset from Sun -->
        <group rotation={[0, 0, tilt]}>      <!-- Axial tilt -->
          <Planet />                          <!-- The visible sphere, self-rotates -->
          {moons.map(moon =>
            <group>                           <!-- Moon orbital group -->
              <group position={[moonDist, 0, 0]}>
                <Moon />
              </group>
            </group>
          )}
        </group>
      </group>
    </group>
  )}

  {comets.map(comet => <Comet />)}
</Canvas>
```

**Key insight:** By nesting groups, we never manually compute "where is this moon in world space." The scene graph does it. Each orbital group just rotates around Y at its own speed.

---

## Orbit Math

All orbit computation lives in `src/utils/orbitMath.js`.

**Critical: Use absolute time, not accumulated deltas.** The position at any moment is `angle = speed * elapsedTime`. Never `angle += speed * deltaTime` — that accumulates floating-point drift and planets desync over time.

### Circular Orbits (Planets, Moons)
```
x = distance * cos(speed * elapsedTime + initialAngle)
z = distance * sin(speed * elapsedTime + initialAngle)
y = 0  (or small offset for inclined orbits)
```

### Elliptical Orbits (Comets)
Use Kepler's equation. Given semi-major axis `a`, eccentricity `e`, and mean anomaly `M = speed * elapsedTime`:
1. Solve `E - e * sin(E) = M` for eccentric anomaly `E` (Newton's method, 5-10 iterations)
2. True anomaly: `v = 2 * atan2(sqrt(1+e) * sin(E/2), sqrt(1-e) * cos(E/2))`
3. Radius: `r = a * (1 - e * cos(E))`
4. Position: `x = r * cos(v)`, `z = r * sin(v)`

For inclination, rotate the resulting position around X axis by the inclination angle.

---

## Camera and Controls

- **OrbitControls** from `@react-three/drei` for base interaction (drag, zoom, touch)
- **Auto-focus animation:** Custom hook `useCameraAnimation.js` using `useFrame` with `lerp` (linear interpolation) for smooth camera transitions when selecting a body
- Camera target (lookAt) also lerps smoothly to the selected body's position
- **CameraController.jsx** wraps OrbitControls and the animation hook together, managing the transition between free-look and auto-focus modes
- Touch targets: All tappable bodies have invisible expanded hit spheres (see Hit Area Expansion above)
- **`preserveDrawingBuffer: true`** on the R3F `<Canvas>` — required for the postcard screenshot feature. Set this from day one.

### Camera Presets
| Mode | Position | LookAt | Notes |
|------|----------|--------|-------|
| Default overview | [0, 80, 120] | [0, 0, 0] | Shows full system |
| Planet focus | computed | planet position | Distance = planet.radius * 6 |
| Size comparison | [0, 10, 50] | [0, 0, 0] | Side view of lineup |

---

## UI Overlay Components

All UI is HTML/CSS (Tailwind) layered on top of the 3D canvas using absolute/fixed positioning. These are NOT 3D elements.

### FactCard
- Slides in from the right on desktop (width > 768px), up from bottom on mobile
- Content: body name, one fun fact (randomly chosen), key stats, "Next Fact" button, X to dismiss
- Semi-transparent dark background (`bg-black/70 backdrop-blur-sm`), white text, rounded corners
- Dismiss also resets camera to default view

### TimeSlider
- Fixed to bottom center of screen
- Range input: 0.1x to 20x, default 1x
- Play/pause button (large, 44x44px minimum)
- Speed label showing current multiplier
- Keyboard: Space = play/pause, Up/Down arrows = adjust speed

### ModeToggle (Spacecraft)
- Rocket icon button, fixed position
- Toggles spacecraft visibility and flight mode

### VolumeControl
- Top-right corner, mute/unmute toggle + optional slider
- Default: 50% volume

### DiscoveryTracker
- Small indicator: "Explored 4 of 22 worlds"
- Persisted to localStorage
- Congratulations overlay when all 22 bodies visited

### SizeComparison
- Toggle button that switches to lineup mode
- Planets arranged left-to-right by size (largest to smallest)
- Sun shown at left edge, partially off-screen (showing scale)
- Labels with planet names and "Nx Earth" size comparison
- Camera transitions to a side view, allows horizontal scrolling

### BackButton
- Returns camera to default overview
- Clears selected body

---

## Fact Cards: Content

Store all facts in `src/data/facts.json`. Structure:
```json
{
  "earth": {
    "name": "Earth",
    "stats": {
      "sizeVsEarth": "1x (it IS Earth!)",
      "distanceFromSun": "93 million miles",
      "numberOfMoons": 1,
      "dayLength": "24 hours",
      "yearLength": "365 days"
    },
    "facts": [
      "Earth is the only planet with liquid water on its surface!",
      "If Earth were the size of a basketball, the Moon would be a tennis ball.",
      "..."
    ]
  }
}
```

### Writing Guidelines
- Ages 4-8. Short sentences. Simple words.
- Use concrete comparisons: sizes of sports balls, speeds of animals, time spans a kid understands
- At least 1 "whoa!" fact per body that is genuinely surprising
- 5-8 facts per body
- No scientific notation. No units a kid wouldn't know.

---

## Audio

Howler.js for simple stereo playback. This is NOT spatial/3D audio — just ambient background and triggered sounds.

### Audio Files (in `public/audio/`)
| File | Purpose | Notes |
|------|---------|-------|
| `ambient-space.mp3` | Background loop | Low drone, < 200KB, looped |
| `planet-tones/mercury.mp3` through `pluto.mp3` | Per-body selection sound | Unique chord per planet, < 100KB each |
| `sfx/whoosh.mp3` | Spacecraft travel | < 50KB |
| `sfx/arrive.mp3` | Spacecraft arrival | < 50KB |
| `sfx/click.mp3` | UI button taps | < 20KB |

**Sourcing:** Audio files should be sourced manually (royalty-free sites like freesound.org, pixabay.com/sound-effects) or generated with tools like jsfxr.frozenfrog.com. Claude Code cannot generate audio files. Placeholder silence files (1-second MP3s) should be created during setup so the code compiles, then replaced with real audio later.

### Audio Behavior
- All audio is opt-in. Show "🔊 Turn on Sound" button on first load.
- Browser autoplay policy: AudioContext is only created after the first user tap on the sound button.
- Ambient loops continuously when enabled.
- Planet tone plays on body selection, fades out on deselection.
- All audio pauses when the browser tab is hidden (use `visibilitychange` event).
- Howler handles mobile audio unlock via its built-in audio sprite system.

---

## Texture Strategy

### The Problem
NASA 2K textures are beautiful but heavy. 10+ textures at 2048x2048 = ~40MB of GPU memory. Mobile Safari caps WebGL texture memory and will crash.

### The Solution: Progressive Loading with Fallbacks

**Stage 1 (immediate, <2 seconds):** Render everything with procedural fallback colors. The solar system is visible and interactive within 2 seconds of page load. No progress bar needed — the kid can start exploring immediately.

**Stage 2 (background, 5-30 seconds):** Load 2K textures in priority order via `useTexture` from drei with `Suspense` boundaries per planet. Textures pop in as they load. Priority order: Sun, Earth, Jupiter, Saturn (the "hero" bodies kids go to first), then the rest.

**Stage 3 (on-demand):** Moon textures (1K) only load when the camera is within 2x the moon's orbital distance of its parent planet.

### Texture Specifications
| Body | Resolution | Format | Estimated Size |
|------|-----------|--------|----------------|
| Sun | 2K (2048x2048) | JPEG | ~400KB |
| Planets (each) | 2K | JPEG | ~300-500KB |
| Earth clouds | 2K | PNG (needs alpha) | ~600KB |
| Earth night | 2K | JPEG | ~400KB |
| Saturn rings | 1K x 256 | PNG (needs alpha) | ~100KB |
| Moons (each) | 1K (1024x1024) | JPEG | ~100KB |

**Total texture payload: ~6-8MB** (loaded progressively, not blocking)

### Fallback Colors (hex, used before texture loads)
| Body | Color |
|------|-------|
| Sun | #FDB813 |
| Mercury | #8C7E6E |
| Venus | #C4A24D |
| Earth | #2B65B8 |
| Mars | #C1440E |
| Jupiter | #C88B3A |
| Saturn | #D4BE8D |
| Uranus | #73C2C6 |
| Neptune | #3B5BA5 |
| Pluto | #C4B59A |
| Moon (generic) | #888888 |

### Texture Sources (Manual Download)
These must be downloaded by the developer before starting the build:
- Primary: https://www.solarsystemscope.com/textures/ (free, consistent style)
- Backup: https://visibleearth.nasa.gov/ (NASA, public domain)
- Backup: http://planetpixelemporium.com/ (free for non-commercial)

Save to `public/textures/` following the file structure below.

---

## Error Handling and Resilience

### React Error Boundary
Wrap the entire `<Canvas>` in a React Error Boundary that catches Three.js crashes and shows a friendly fallback: "Oops! The universe had a hiccup. Tap to reload." with a button that reloads the page.

### WebGL Context Loss
Listen for the `webglcontextlost` event on the canvas element. On context loss, show a message and attempt recovery via `webglcontextrestored`. If recovery fails, show the reload button.

### Texture Load Failure
If any texture fails to load (network error, 404), the planet continues rendering with its fallback color. No crash. Log the error to console but don't surface it to the kid.

### Performance Adaptation
Monitor FPS using a rolling average (not instantaneous — that's noisy). If average FPS over 3 seconds drops below 30:
1. Reduce asteroid belt to 200 instances
2. Disable bloom post-processing
3. Reduce sphere segment count from 64 to 32
4. Disable comet tail rendering
Store the quality level in Zustand so all components can react.

---

## Zustand Store Schema (Complete)

Define the entire store upfront in `src/stores/useStore.js`. Even features not yet built should have their state slots reserved.

```javascript
const useStore = create((set, get) => ({
  // Time
  timeSpeed: 1,          // 0.1 to 20
  isPaused: false,
  elapsedTime: 0,        // Accumulated simulation time (respects pause and speed)

  // Selection
  selectedBody: null,     // string key like "earth", "io", or null
  previousBody: null,     // for back navigation

  // Modes
  spacecraftMode: false,
  sizeComparisonMode: false,
  isFlying: false,        // spacecraft in transit
  flightTarget: null,     // destination body key

  // Audio
  audioEnabled: false,    // user has opted in
  masterVolume: 0.5,      // 0 to 1

  // Discovery
  visitedBodies: [],      // array of body keys, persisted to localStorage
  factsViewed: 0,         // count of "Next Fact" taps

  // Performance
  qualityLevel: 'high',   // 'high' | 'medium' | 'low'

  // Actions
  setTimeSpeed: (speed) => set({ timeSpeed: speed }),
  togglePause: () => set((s) => ({ isPaused: !s.isPaused })),
  selectBody: (key) => set((s) => ({
    selectedBody: key,
    previousBody: s.selectedBody
  })),
  clearSelection: () => set({ selectedBody: null }),
  toggleSpacecraftMode: () => set((s) => ({ spacecraftMode: !s.spacecraftMode })),
  toggleSizeComparison: () => set((s) => ({
    sizeComparisonMode: !s.sizeComparisonMode,
    isPaused: !s.sizeComparisonMode ? true : s.isPaused
  })),
  markVisited: (key) => set((s) => ({
    visitedBodies: s.visitedBodies.includes(key)
      ? s.visitedBodies
      : [...s.visitedBodies, key]
  })),
  setQualityLevel: (level) => set({ qualityLevel: level }),
  enableAudio: () => set({ audioEnabled: true }),
  setMasterVolume: (vol) => set({ masterVolume: vol }),
}));
```

---

## File Structure

```
solar-system-explorer/
├── public/
│   ├── textures/                    # Downloaded manually before build
│   │   ├── sun.jpg
│   │   ├── mercury.jpg
│   │   ├── venus.jpg
│   │   ├── venus-clouds.jpg
│   │   ├── earth/
│   │   │   ├── surface.jpg
│   │   │   ├── clouds.png
│   │   │   └── night.jpg
│   │   ├── mars.jpg
│   │   ├── jupiter.jpg
│   │   ├── saturn.jpg
│   │   ├── saturn-ring.png
│   │   ├── uranus.jpg
│   │   ├── neptune.jpg
│   │   ├── pluto.jpg
│   │   └── moons/
│   │       ├── moon.jpg
│   │       ├── io.jpg
│   │       ├── europa.jpg
│   │       ├── ganymede.jpg
│   │       ├── callisto.jpg
│   │       ├── titan.jpg
│   │       ├── enceladus.jpg
│   │       ├── titania.jpg
│   │       ├── oberon.jpg
│   │       ├── triton.jpg
│   │       ├── charon.jpg
│   │       ├── phobos.jpg
│   │       └── deimos.jpg
│   └── audio/
│       ├── ambient-space.mp3
│       ├── planet-tones/
│       │   ├── mercury.mp3
│       │   ├── venus.mp3
│       │   ├── earth.mp3
│       │   ├── mars.mp3
│       │   ├── jupiter.mp3
│       │   ├── saturn.mp3
│       │   ├── uranus.mp3
│       │   ├── neptune.mp3
│       │   └── pluto.mp3
│       └── sfx/
│           ├── whoosh.mp3
│           ├── arrive.mp3
│           └── click.mp3
├── src/
│   ├── App.jsx                      # Canvas + ErrorBoundary + UI overlay container
│   ├── main.jsx                     # Entry point (NO StrictMode)
│   ├── index.css                    # Tailwind imports + global styles
│   ├── components/
│   │   ├── SolarSystem.jsx          # Main 3D scene: renders Sun, planets, belt, comets
│   │   ├── Sun.jsx                  # Emissive sphere + point light + bloom
│   │   ├── Planet.jsx               # Reusable: orbital group > tilt group > sphere + moons
│   │   ├── Moon.jsx                 # Sphere orbiting parent planet group
│   │   ├── AsteroidBelt.jsx         # InstancedMesh torus of rocks
│   │   ├── Comet.jsx                # Elliptical orbit + cone tail
│   │   ├── OrbitLine.jsx            # Faint circle for each orbit
│   │   ├── Starfield.jsx            # Points-based stars + constellation lines
│   │   ├── Spacecraft.jsx           # Rocket geometry + bezier flight path
│   │   ├── CameraController.jsx     # OrbitControls wrapper + auto-focus animation
│   │   ├── ErrorBoundary.jsx        # Catches Three.js / React crashes
│   │   ├── PerformanceMonitor.jsx   # FPS monitoring, triggers quality adaptation
│   │   └── ui/
│   │       ├── FactCard.jsx
│   │       ├── TimeSlider.jsx
│   │       ├── ModeToggle.jsx
│   │       ├── SizeComparison.jsx
│   │       ├── DiscoveryTracker.jsx
│   │       ├── VolumeControl.jsx
│   │       ├── BackButton.jsx
│   │       ├── SoundEnableButton.jsx # First-load audio opt-in
│   │       └── PostcardCapture.jsx   # Screenshot + frame feature
│   ├── data/
│   │   ├── planets.json             # Planet configs (references scaleConfig values)
│   │   ├── moons.json               # Moon configs per parent
│   │   ├── facts.json               # All facts by body key
│   │   ├── comets.json              # Comet orbital parameters
│   │   └── constellations.json      # Star positions + line connections
│   ├── stores/
│   │   └── useStore.js              # Complete Zustand store (schema above)
│   ├── hooks/
│   │   ├── useAudio.js              # Howler wrapper hook
│   │   ├── useCameraAnimation.js    # Lerp-based camera transitions
│   │   └── usePerformance.js        # FPS monitoring hook
│   └── utils/
│       ├── orbitMath.js             # Circular + elliptical orbit computation
│       └── scaleConfig.js           # ALL sizes, distances, speeds (single source of truth)
├── .gitignore                       # node_modules, dist, .DS_Store, *.log
├── package.json
├── vite.config.js
├── postcss.config.js
├── tailwind.config.js               # Tailwind v3 config
├── CLAUDE.md                        # This file
└── index.html
```

---

## Iframe Embedding

The app must work embedded:
```html
<iframe
  src="https://solar.rohitgarrg.com"
  width="100%"
  height="600"
  style="min-height: 500px; border: none;"
  allow="autoplay"
></iframe>
```

**Headers to set on the hosting server:**
```
Content-Security-Policy: frame-ancestors 'self' https://rohitgarrg.com https://*.rohitgarrg.com;
```
(Do NOT use the deprecated `X-Frame-Options` header.)

Requirements:
- Responsive: fills container width, minimum height 500px
- Touch events pass through (test specifically: pinch zoom, two-finger rotate, tap)
- Textures served from same origin or CDN with proper CORS
- `allow="autoplay"` attribute for audio
- No scroll hijacking — scroll events stay inside the iframe

---

## Edge Cases

| Scenario | Handling |
|----------|----------|
| Touch vs Mouse | OrbitControls handles both natively. Tap = click. Pinch = scroll. |
| Low-end device | PerformanceMonitor detects FPS < 30, triggers quality reduction |
| Autoplay blocked | Sound button gates all audio. No sound until tapped. |
| Small screens (< 640px) | Fact card becomes full-width bottom sheet. Buttons repositioned. |
| Orientation change | Canvas resizes via R3F's built-in resize handler. UI re-flows via Tailwind responsive classes. |
| Texture fails to load | Fallback color stays. Error logged. No crash. |
| WebGL context lost | Show friendly error, attempt restore, offer reload. |
| Window resize | R3F Canvas handles this automatically. |
| Browser back button | No client-side routing, so no issue. |
| React StrictMode | Disabled in main.jsx to prevent double-mount issues. |
| Very long sessions | Absolute-time orbit math prevents drift. No memory leaks from proper cleanup. |

---

## What NOT to Build (Phase 1 Scope)

- User accounts or cloud sync
- Multiplayer or shared viewing
- Planet customization or coloring mode
- Quiz mode or gamification beyond discovery counter
- Realistic physics simulation
- VR/AR mode
- Backend/server (fully static)
- "1 second = 1 day" mode (removed — adds complexity, low kid appeal)

---

## Future Phases (Architecture should not block these)

- **Phase 2:** iPad native (SwiftUI + SceneKit), reusing JSON data files
- **Phase 3:** Planet coloring/decoration mode
- **Phase 4:** "Build Your Own Solar System" sandbox
- **Phase 5:** AR sky-pointing mode
