# Solar System Explorer — Build Checklist

## Phase 1: Core 3D Scene
- [ ] Sun — emissive sphere + point light + bloom glow
- [ ] Starfield — points-based background stars
- [ ] Planet component — orbital rotation, axial tilt, textured sphere
- [ ] Render all 9 planets with correct scale, distance, speed
- [ ] Moon component — orbital rotation around parent
- [ ] Render all 12 moons attached to parent planet groups
- [ ] Orbit lines — faint circles for each planetary orbit
- [ ] Saturn rings with UV fix
- [ ] Earth cloud layer (second sphere)
- [ ] Venus cloud layer
- [ ] Asteroid belt — InstancedMesh torus
- [ ] Comets — elliptical orbits + cone tails

## Phase 2: Camera & Interaction
- [ ] CameraController — OrbitControls with zoom limits
- [ ] Tap/click to select a body (hit area expansion for small bodies)
- [ ] Auto-focus camera animation (lerp to selected body)
- [ ] Back button — return to default overview
- [ ] Keyboard controls (Space = pause, arrows = speed)

## Phase 3: UI Overlays
- [ ] Fact card — slide-in panel with body info and fun facts
- [ ] Time slider — speed control (0.1x to 20x) + play/pause
- [ ] Discovery tracker — "Explored X of 22 worlds"
- [ ] Size comparison mode — planet lineup view
- [ ] Spacecraft mode toggle
- [ ] Spacecraft component — rocket geometry + bezier flight path
- [ ] Postcard capture — screenshot with frame

## Phase 4: Audio
- [ ] Sound enable button (opt-in, browser autoplay policy)
- [ ] Ambient space background loop
- [ ] Per-planet selection tones
- [ ] SFX: whoosh (travel), arrive, click
- [ ] Volume control
- [ ] Pause audio on tab hidden

## Phase 5: Polish & Performance
- [ ] Performance monitor — FPS tracking, quality adaptation
- [ ] Progressive texture loading (fallback colors → 2K textures)
- [ ] On-demand moon texture loading (proximity-based)
- [ ] WebGL context loss recovery
- [ ] Responsive layout (mobile fact card, button repositioning)
- [ ] localStorage persistence for discovery progress
- [ ] Iframe embedding compatibility testing
- [ ] Touch gesture testing (pinch zoom, two-finger rotate, tap)
- [ ] Download and add NASA/Solar System Scope textures
- [ ] Download/create audio files (ambient, planet tones, SFX)
