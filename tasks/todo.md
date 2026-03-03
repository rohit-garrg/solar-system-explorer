# Solar System Explorer — Build Checklist

## Phase 1: Core 3D Scene
- [x] Sun — emissive sphere + point light + bloom glow
- [x] Starfield — points-based background stars
- [x] Planet component — orbital rotation, axial tilt, textured sphere
- [x] Render all 9 planets with correct scale, distance, speed
- [x] Moon component — orbital rotation around parent
- [x] Render all 12 moons attached to parent planet groups
- [x] Orbit lines — faint circles for each planetary orbit
- [x] Saturn rings with UV fix
- [x] Earth cloud layer (second sphere)
- [x] Venus cloud layer
- [x] Asteroid belt — InstancedMesh torus
- [x] Comets — elliptical orbits + cone tails

## Phase 2: Camera & Interaction
- [x] CameraController — OrbitControls with zoom limits
- [x] Tap/click to select a body (hit area expansion for small bodies)
- [x] Auto-focus camera animation (lerp to selected body)
- [x] Back button — return to default overview
- [x] Keyboard controls (Space = pause, arrows = speed)

## Phase 3: UI Overlays
- [x] Fact card — slide-in panel with body info and fun facts
- [x] Time slider — speed control (0.1x to 20x) + play/pause
- [x] Discovery tracker — "Explored X of 22 worlds"
- [x] Size comparison mode — planet lineup view
- [x] Spacecraft mode toggle
- [x] Spacecraft component — rocket geometry + bezier flight path
- [x] Postcard capture — screenshot with frame

## Phase 4: Audio
- [x] Sound enable button (opt-in, browser autoplay policy)
- [x] Ambient space background loop
- [x] Per-planet selection tones
- [x] SFX: whoosh (travel), arrive, click
- [x] Volume control
- [x] Pause audio on tab hidden

## Phase 5: Polish & Performance
- [x] Performance monitor — FPS tracking, quality adaptation
- [x] Progressive texture loading (fallback colors → 2K textures)
- [x] On-demand moon texture loading (proximity-based)
- [x] WebGL context loss recovery
- [x] Responsive layout (mobile fact card, button repositioning)
- [x] localStorage persistence for discovery progress
- [x] Iframe embedding compatibility testing
- [x] Touch gesture testing (pinch zoom, two-finger rotate, tap)
- [ ] Download and add NASA/Solar System Scope textures (partial — some added)
- [ ] Download/create audio files (ambient, planet tones, SFX)

## Phase 6: Code Cleanup
- [x] Extract shared TextureErrorBoundary (was duplicated in Planet, Moon, Sun)
- [x] Extract cloud prop objects to reduce repetition in Planet.jsx
- [x] Extract FallbackMoonMaterial component in Moon.jsx
