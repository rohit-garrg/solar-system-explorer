# Solar System Explorer — Master Prompt for Autonomous Build

## Global Instructions

IMPORTANT: Before starting ANY step, re-read CLAUDE.md in the project root. It is the single source of truth for all values, architecture, file structure, and technical decisions. Every number (radii, distances, speeds, tilts, colors) comes from CLAUDE.md. Never invent values.

After completing each step:
1. Run `npm run build` to verify compilation
2. If the build fails, debug and fix (up to 3 attempts per error)
3. If you cannot fix after 3 attempts, document the issue in BUILD_ISSUES.md and move on
4. Commit: `git add . && git commit -m "Step N: description"`
5. Append status to PROGRESS.md: `Step N: [DONE|FAILED] - brief description`

When modifying existing files, ALWAYS read the file first to understand its current state. Do not assume you know what is in a file from a previous step.

---

## CHUNK 1: Foundation (Steps 1-4)

### Step 1: Project Scaffold

Read CLAUDE.md. Initialize the project in the current directory (do NOT create a subdirectory).

1. Run: `npm init vite@latest . -- --template react` (the dot means current directory)
2. Install exact dependency versions:
   ```
   npm install three@0.162.0 @react-three/fiber@8.15.12 @react-three/drei@9.99.0 @react-three/postprocessing@2.16.0 zustand@4.5.0 howler@2.2.4
   ```
3. Install Tailwind CSS v3 (NOT v4):
   ```
   npm install -D tailwindcss@3.4.1 postcss@8.4.33 autoprefixer@10.4.17
   npx tailwindcss init -p
   ```
4. Configure `tailwind.config.js` to scan `src/**/*.{js,jsx}`
5. In `src/index.css`, add the three Tailwind directives plus fullscreen black background styles for html, body, #root
6. In `src/main.jsx`, render App WITHOUT React.StrictMode (StrictMode double-mounts effects and breaks Three.js)
7. Create ALL placeholder files from the File Structure section of CLAUDE.md. Component files export a function returning null. Data JSON files have correct shape but empty arrays/objects.
8. Create `src/utils/scaleConfig.js` with EVERY value from the Scale System section of CLAUDE.md: planet radii, orbital distances, orbital speeds, rotation speeds, axial tilts, moon configs, camera defaults, hit area expansion rules, fallback colors.
9. Create `src/stores/useStore.js` with the complete Zustand store schema from CLAUDE.md (copy it exactly).
10. Create `src/components/ErrorBoundary.jsx`: React class component catching errors, showing "Something went wrong. Tap to reload."
11. Create `.gitignore`: node_modules, dist, .DS_Store, *.log, .env

Verification: `npm run build` succeeds. All files exist at paths specified in CLAUDE.md.

### Step 2: 3D Scene, Sun, and Starfield

1. In `src/App.jsx`:
   - Wrap everything in ErrorBoundary
   - Create R3F `<Canvas>` filling 100vw x 100vh
   - Canvas props: `camera={{ position: [0, 80, 120], fov: 45, near: 0.1, far: 1000 }}`, `preserveDrawingBuffer={true}`, `gl={{ antialias: true, alpha: false }}`
   - Inside Canvas: render `<SolarSystem />` and `<CameraController />`
   - Outside Canvas (sibling div): placeholder for UI overlays

2. `src/components/CameraController.jsx`:
   - Import OrbitControls from @react-three/drei
   - Props: enablePan, enableZoom, enableRotate all true; minDistance=5, maxDistance=200; enableDamping=true, dampingFactor=0.05

3. `src/components/Sun.jsx` (import sunRadius from scaleConfig):
   - `<mesh>` with `<sphereGeometry args={[sunRadius, 64, 64]} />`
   - `<meshBasicMaterial color="#FDB813" />` (Basic, NOT Standard)
   - Glow: second mesh at sunRadius*1.2, `<meshBasicMaterial color="#FFA500" transparent opacity={0.15} side={THREE.BackSide} />`
   - `<pointLight position={[0,0,0]} intensity={2} color="white" />`

4. `src/components/Starfield.jsx`:
   - 2000 random points on sphere radius 500
   - Use `<Points>` from drei with `<PointMaterial>` size 0.5, white, sizeAttenuation={false}
   - Vary brightness per point between rgb(0.5,0.5,0.5) and rgb(1,1,1)

5. `src/components/SolarSystem.jsx`: render `<Sun />` and `<Starfield />`

Verification: `npm run build` succeeds.

### Step 3: Planets with Color, Rotation, and Tilt

1. Fill in `src/data/planets.json`:
   ```json
   [
     { "key": "mercury", "name": "Mercury", "texture": "mercury.jpg", "fallbackColor": "#8C7E6E" },
     { "key": "venus", "name": "Venus", "texture": "venus.jpg", "fallbackColor": "#C4A24D" },
     { "key": "earth", "name": "Earth", "texture": "earth/surface.jpg", "fallbackColor": "#2B65B8" },
     { "key": "mars", "name": "Mars", "texture": "mars.jpg", "fallbackColor": "#C1440E" },
     { "key": "jupiter", "name": "Jupiter", "texture": "jupiter.jpg", "fallbackColor": "#C88B3A" },
     { "key": "saturn", "name": "Saturn", "texture": "saturn.jpg", "fallbackColor": "#D4BE8D" },
     { "key": "uranus", "name": "Uranus", "texture": "uranus.jpg", "fallbackColor": "#73C2C6" },
     { "key": "neptune", "name": "Neptune", "texture": "neptune.jpg", "fallbackColor": "#3B5BA5" },
     { "key": "pluto", "name": "Pluto", "texture": "pluto.jpg", "fallbackColor": "#C4B59A" }
   ]
   ```
   All numeric values (radii, distances, speeds, tilts) come from scaleConfig.js, NOT duplicated here.

2. `src/components/Planet.jsx` — nested groups per Scene Graph Hierarchy in CLAUDE.md:
   - Outer group: orbital rotation (animated in step 4)
   - Middle group: position at [distance, 0, 0]
   - Inner group: axial tilt as z-rotation (convert degrees to radians)
   - Mesh: `<sphereGeometry>` + `<meshStandardMaterial color={fallbackColor} />`
   - Self-rotation via useFrame: `mesh.current.rotation.y += rotationSpeed * delta`
   - For now, place all planets at angle 0 (along positive X axis). Orbital animation comes in step 4.

3. `src/components/SolarSystem.jsx`: import planets.json and scaleConfig, map and render `<Planet>` for each. Add `<ambientLight intensity={0.1} />`.

Verification: `npm run build` succeeds.

### Step 4: Orbital Animation and Orbit Lines

1. `src/utils/orbitMath.js` — two functions:

   `getCircularOrbitPosition(distance, speed, elapsedTime, initialAngle = 0)`:
   - Returns `{ x, z }` using `x = distance * cos(speed * elapsedTime + initialAngle)`, `z = distance * sin(speed * elapsedTime + initialAngle)`
   - CRITICAL: absolute time, NOT accumulated angle

   `getEllipticalOrbitPosition(semiMajorAxis, eccentricity, speed, elapsedTime, inclination = 0)`:
   - Solve Kepler's equation via Newton's method (10 iterations)
   - Return `{ x, y, z }` with inclination rotation applied
   - This is for comets later, but build now.

2. Update `src/components/Planet.jsx`:
   - Read elapsedTime from Zustand store
   - In useFrame: compute position via getCircularOrbitPosition, apply to outer group

3. Add elapsed time updater in `src/components/SolarSystem.jsx` (or a TimeManager component):
   - In useFrame: `if (!isPaused) set elapsedTime += delta * timeSpeed`
   - This is the ONLY place elapsed time updates.

4. `src/components/OrbitLine.jsx`:
   - Takes distance prop, renders circle with 128 points
   - White, opacity 0.15, transparent

5. Render OrbitLine per planet in SolarSystem.jsx.

Verification: `npm run build` succeeds.

---

## CHUNK 2: Core Features (Steps 5-8)

### Step 5: Click to Select + Fact Cards

Read `src/components/Planet.jsx`, `src/components/Sun.jsx`, `src/components/CameraController.jsx`, `src/stores/useStore.js`, and `src/utils/scaleConfig.js` before making changes.

1. Make planets clickable in `src/components/Planet.jsx`:
   - Add onClick to mesh: `() => store.selectBody(planet.key)`
   - Add invisible hit area mesh per CLAUDE.md Hit Area Expansion rules (for visual radius < 0.5: invisible sphere with radius = max(visualRadius * 2.5, 0.5))
   - Hover effect: scale up 1.15x on pointerOver, back to 1x on pointerOut, lerp in useFrame

2. Make Sun clickable with same pattern in `src/components/Sun.jsx`.

3. Create `src/hooks/useCameraAnimation.js`:
   - When selectedBody changes, lerp camera position toward target (body position + offset of body radius * 6)
   - Also lerp OrbitControls target toward body position
   - Use THREE.Vector3.lerp with factor 0.05
   - When selectedBody is null, lerp back to default camera from scaleConfig

4. Wire useCameraAnimation into `src/components/CameraController.jsx`.

5. Fill `src/data/facts.json` with 5-8 fun facts per body (Sun + 9 planets = 10 bodies). Follow writing guidelines in CLAUDE.md: ages 4-8, short sentences, concrete comparisons, at least 1 "whoa!" fact per body. Include stats: sizeVsEarth, distanceFromSun, numberOfMoons, dayLength, yearLength.

6. Create `src/components/ui/FactCard.jsx`:
   - Reads selectedBody from store, looks up facts.json
   - Shows: name, random fact, "Next Fact" button, key stats, X dismiss button
   - Desktop (>768px): fixed right panel, w-96, slides in from right
   - Mobile (<=768px): bottom sheet, h-1/2, full width, slides up
   - Styling: bg-black/70 backdrop-blur-sm, text-white, rounded corners
   - X button calls store.clearSelection()
   - CSS transition for slide animation

7. Create `src/components/ui/BackButton.jsx`: calls store.clearSelection(), positioned top-left.

8. Render FactCard and BackButton in the UI overlay div in `src/App.jsx` (outside Canvas).

Verification: `npm run build` succeeds.

### Step 6: Time Controls

Read `src/components/ui/TimeSlider.jsx` (placeholder), `src/stores/useStore.js`, and `src/App.jsx` before making changes.

1. `src/components/ui/TimeSlider.jsx`:
   - Fixed bottom center
   - `<input type="range">` min=0.1 max=20 step=0.1 default=1
   - onChange: store.setTimeSpeed(value)
   - Display: "1.0x", "5.0x" etc
   - Play/pause toggle button (store.togglePause)
   - Styling: bg-black/60 backdrop-blur-sm rounded-full px-6 py-3
   - Large thumb (24px+) for kid fingers
   - When speed > 5x, show text "Fast Forward" near label

2. Keyboard shortcuts (add in App.jsx or TimeSlider):
   - Space: toggle pause
   - ArrowUp: increase speed by 1 (cap at 20)
   - ArrowDown: decrease speed by 1 (min 0.1)

3. Render TimeSlider in UI overlay in App.jsx.

Verification: `npm run build` succeeds.

### Step 7: Textures

Read `src/components/Planet.jsx`, `src/components/Sun.jsx` before making changes.

NOTE: Texture files may not exist in public/textures/ yet. The code must handle missing textures gracefully — fallback colors show, no crashes.

1. Update `src/components/Planet.jsx`:
   - Create inner TexturedPlanet component wrapped in `<Suspense fallback={<FallbackPlanet />}>`
   - TexturedPlanet uses useTexture from drei to load texture
   - FallbackPlanet is the existing colored sphere
   - If texture load fails, fallback color stays. Error logged, no crash.

2. `src/components/Sun.jsx`: if sun.jpg exists, apply as map on MeshBasicMaterial.

3. Saturn rings (inside Saturn's planet rendering in Planet.jsx or a sub-component):
   - RingGeometry with innerRadius=2.2, outerRadius=3.8
   - Apply UV fix from CLAUDE.md (remap UVs so texture maps linearly along radius)
   - Material: DoubleSide, transparent. If no ring texture, use semi-transparent gold.
   - Rotate ring 90 degrees on X to lie flat in XZ plane

4. Earth cloud layer: second sphere at earthRadius*1.02, transparent, opacity 0.4, rotating 1.1x surface speed. Skip night lights (add TODO comment).

5. Venus cloud layer: sphere at venusRadius*1.03, yellowish-white, opacity 0.7.

Verification: `npm run build` succeeds.

### Step 8: Moons

Read `src/components/Planet.jsx`, `src/components/Moon.jsx` (placeholder), `src/utils/scaleConfig.js`, `src/data/facts.json` before making changes.

1. Fill `src/data/moons.json`:
   ```json
   [
     { "key": "moon", "name": "Moon", "parent": "earth", "texture": "moons/moon.jpg", "fallbackColor": "#888888" },
     { "key": "phobos", "name": "Phobos", "parent": "mars", "texture": "moons/phobos.jpg", "fallbackColor": "#888888" },
     { "key": "deimos", "name": "Deimos", "parent": "mars", "texture": "moons/deimos.jpg", "fallbackColor": "#888888" },
     { "key": "io", "name": "Io", "parent": "jupiter", "texture": "moons/io.jpg", "fallbackColor": "#888888" },
     { "key": "europa", "name": "Europa", "parent": "jupiter", "texture": "moons/europa.jpg", "fallbackColor": "#888888" },
     { "key": "ganymede", "name": "Ganymede", "parent": "jupiter", "texture": "moons/ganymede.jpg", "fallbackColor": "#888888" },
     { "key": "callisto", "name": "Callisto", "parent": "jupiter", "texture": "moons/callisto.jpg", "fallbackColor": "#888888" },
     { "key": "titan", "name": "Titan", "parent": "saturn", "texture": "moons/titan.jpg", "fallbackColor": "#888888" },
     { "key": "enceladus", "name": "Enceladus", "parent": "saturn", "texture": "moons/enceladus.jpg", "fallbackColor": "#888888" },
     { "key": "titania", "name": "Titania", "parent": "uranus", "texture": "moons/titania.jpg", "fallbackColor": "#888888" },
     { "key": "oberon", "name": "Oberon", "parent": "uranus", "texture": "moons/oberon.jpg", "fallbackColor": "#888888" },
     { "key": "triton", "name": "Triton", "parent": "neptune", "texture": "moons/triton.jpg", "fallbackColor": "#888888" },
     { "key": "charon", "name": "Charon", "parent": "pluto", "texture": "moons/charon.jpg", "fallbackColor": "#888888" }
   ]
   ```
   All numeric values from scaleConfig.js.

2. `src/components/Moon.jsx`: sphere with texture/fallback, self-rotates slowly.

3. In `src/components/Planet.jsx`: render moons as CHILDREN of the tilt group. Moon orbital group rotates at moon's speed, moon positioned at [moonOrbitDistance, 0, 0]. Moons inherit planet position automatically via scene graph.

4. Moon visibility optimization: only render moons when camera is within planet.distance * 0.3 of the planet.

5. Make moons clickable (same pattern as planets: onClick, expanded hit area).

6. Add moon facts to `src/data/facts.json` (3-5 facts per moon, all 12 moons).

Verification: `npm run build` succeeds.

---

## CHUNK 3: Extended Features (Steps 9-13)

### Step 9: Asteroid Belt and Comets

Read `src/components/AsteroidBelt.jsx` (placeholder), `src/components/Comet.jsx` (placeholder), `src/utils/orbitMath.js`, `src/stores/useStore.js`, `src/utils/scaleConfig.js` before making changes.

1. `src/components/AsteroidBelt.jsx`:
   - InstancedMesh with IcosahedronGeometry(1, 0)
   - Count from store.qualityLevel: high=500, medium=200, low=100
   - Random position in torus: angle 0-2pi, radius 38-46, Y offset -1.5 to +1.5
   - Random scale 0.03-0.12, random gray-brown color via instanceColor
   - Rotate entire group at 0.002 rad/s * elapsedTime

2. Fill `src/data/comets.json`:
   ```json
   [
     { "key": "halley", "name": "Halley's Comet", "semiMajorAxis": 60, "eccentricity": 0.967, "inclination": 15, "speed": 0.015, "fallbackColor": "#E8F4FD" },
     { "key": "halebopp", "name": "Comet Hale-Bopp", "semiMajorAxis": 80, "eccentricity": 0.95, "inclination": 20, "speed": 0.01, "fallbackColor": "#E8F4FD" }
   ]
   ```

3. `src/components/Comet.jsx`:
   - Position via getEllipticalOrbitPosition from orbitMath.js
   - Body: sphere radius 0.15, icy blue-white
   - Tail: ConeGeometry pointing AWAY from Sun. Direction = normalize(cometPos - sunPos). Length = clamp(5/distToSun, 1, 5). Material: MeshBasicMaterial, light blue, transparent, opacity 0.4, additiveBlending.
   - Make clickable. Add 2-3 facts each to facts.json.

4. Render both in `src/components/SolarSystem.jsx`.

Verification: `npm run build` succeeds.

### Step 10: Spacecraft Mode

Read `src/components/Spacecraft.jsx` (placeholder), `src/components/ui/ModeToggle.jsx` (placeholder), `src/stores/useStore.js`, `src/components/ui/DiscoveryTracker.jsx` (placeholder) before making changes.

1. `src/components/Spacecraft.jsx`:
   - Simple rocket from ConeGeometry (nose) + CylinderGeometry (body) + BoxGeometry (fins)
   - About 0.5 scene units tall. White body, red nose, dark gray fins.
   - Only visible when store.spacecraftMode is true.
   - Trail: 20 small spheres following behind, each smaller and more transparent.

2. `src/components/ui/ModeToggle.jsx`:
   - Rocket icon/emoji button, toggles store.spacecraftMode
   - Fixed position, right side

3. Flight mechanics:
   - When spacecraftMode && user clicks planet: set flightTarget and isFlying
   - In useFrame: interpolate position along quadratic bezier (start -> control point at midpoint+20Y -> target)
   - Duration: 3 seconds (progress 0->1)
   - Camera follows in third-person
   - On arrival: isFlying=false, selectBody(flightTarget), markVisited(flightTarget)

4. `src/components/ui/DiscoveryTracker.jsx`:
   - Shows "Explored N of 22 worlds"
   - Load/save visitedBodies from/to localStorage
   - Congratulations overlay when all 22 visited

Verification: `npm run build` succeeds.

### Step 11: Audio Integration

Read `src/hooks/useAudio.js` (placeholder), `src/components/ui/SoundEnableButton.jsx` (placeholder), `src/components/ui/VolumeControl.jsx` (placeholder), `src/stores/useStore.js` before making changes.

NOTE: Audio files may not exist. Create 1-second silent MP3 placeholders using a script, or handle missing files gracefully with try/catch.

1. `src/hooks/useAudio.js`:
   - Creates Howl instances for: ambient loop, planet tones (one per planet), whoosh, arrive, click
   - Functions: playAmbient(), stopAmbient(), playPlanetTone(key), playSfx(name)
   - All gated by store.audioEnabled, all respect store.masterVolume
   - Handle missing audio files gracefully (catch errors, log, continue)

2. `src/components/ui/SoundEnableButton.jsx`:
   - "Turn on Sound" button, floating
   - On click: store.enableAudio(), start ambient
   - Disappears after click

3. `src/components/ui/VolumeControl.jsx`:
   - Mute/unmute toggle, top-right
   - Optional volume slider

4. Wire audio: planet tones on selection, whoosh on flight, arrive on landing, click on Next Fact.

5. Add visibilitychange listener to pause/resume all audio on tab switch.

6. Render SoundEnableButton and VolumeControl in App.jsx UI overlay.

Verification: `npm run build` succeeds.

### Step 12: Constellations and Starfield Polish

Read `src/components/Starfield.jsx`, `src/data/constellations.json` (placeholder) before making changes.

1. Enhance `src/components/Starfield.jsx`:
   - Vary sizes: most 0.3, some bright at 0.8-1.2
   - Twinkling: oscillate opacity of ~200 stars via sin(time * freq + phase). Use ShaderMaterial or update color buffer in useFrame.
   - Named bright stars: Sirius (blue-white), Polaris (white), Betelgeuse (reddish) as larger points.

2. Fill `src/data/constellations.json` with 8 constellations: Big Dipper, Orion, Cassiopeia, Leo, Scorpius, Southern Cross, Canis Major, Cygnus. Each: name, description, stars [{x,y,z}] on sphere radius 490, lines [[idx, idx]].

3. Render constellation lines with `<Line>` from drei, opacity 0.08, white. Only visible when camera distance > 100.

4. Constellation labels via Html from drei on hover.

Verification: `npm run build` succeeds.

### Step 13: Size Comparison Mode

Read `src/components/ui/SizeComparison.jsx` (placeholder), `src/stores/useStore.js`, `src/components/Planet.jsx`, `src/utils/scaleConfig.js` before making changes.

1. `src/components/ui/SizeComparison.jsx`:
   - Toggle button in UI
   - On: store.toggleSizeComparison() (pauses orbits), planets lerp to lineup positions
   - Lineup: sorted by size (Jupiter, Saturn, Uranus, Neptune, Earth, Venus, Mars, Mercury, Pluto), left to right, spaced by radius
   - Sun at far left, only right edge visible
   - Off: planets lerp back to orbital positions, orbits resume

2. Transition: lerp each planet from current to lineup position over 1.5 seconds in useFrame.

3. Labels via Html from drei: planet names + "Nx Earth" comparison.

4. Camera transitions to [0, 10, 50] looking at [0, 0, 0] in comparison mode.

Verification: `npm run build` succeeds.

---

## CHUNK 4: Polish and Production (Steps 14-18)

### Step 14: Postcard from Space

Read `src/components/ui/PostcardCapture.jsx` (placeholder), `src/App.jsx`, `src/stores/useStore.js` before making changes.

1. `src/components/ui/PostcardCapture.jsx`:
   - Camera icon button in UI
   - On click: access renderer via useThree, call gl.domElement.toDataURL('image/png')
   - Show preview overlay (HTML portal outside Canvas) with captured image
   - Decorative CSS border/frame with text: "Greetings from {selectedBody.name}!" or "Exploring the Solar System!"
   - Save button: programmatic download via `<a>` element with download attribute
   - Cancel button to dismiss

2. PostcardCapture button must render INSIDE Canvas (for useThree access), overlay via React portal to HTML overlay container.

Verification: `npm run build` succeeds.

### Step 15: Performance Monitor

Read `src/components/PerformanceMonitor.jsx` (placeholder), `src/hooks/usePerformance.js` (placeholder), `src/stores/useStore.js`, `src/components/AsteroidBelt.jsx`, `src/components/Starfield.jsx`, `src/components/Planet.jsx`, `src/components/Moon.jsx`, `src/components/OrbitLine.jsx` before making changes.

1. `src/components/PerformanceMonitor.jsx` (inside Canvas):
   - Track FPS via rolling average over 60 frames
   - < 30 FPS for 3 seconds: setQualityLevel('medium')
   - < 20 FPS: setQualityLevel('low')
   - > 50 FPS and not 'high': setQualityLevel('high')

2. `src/hooks/usePerformance.js`: reusable FPS tracking hook.

3. Components adapt to qualityLevel:
   - AsteroidBelt: high=500, medium=200, low=100
   - Starfield: high=2000, medium=1000, low=500
   - Planet segments: high=64, medium=32, low=16
   - Comet tail: hidden at 'low'

4. Add React.memo to Planet.jsx, Moon.jsx, OrbitLine.jsx.

5. Texture disposal in useEffect cleanup: `if (texture) texture.dispose()`

Verification: `npm run build` succeeds.

### Step 16: Responsive Layout and Touch Polish

Read `src/components/ui/FactCard.jsx`, `src/components/ui/TimeSlider.jsx`, `src/components/ui/BackButton.jsx`, `src/components/ui/ModeToggle.jsx`, `src/components/ui/VolumeControl.jsx`, `src/components/ui/DiscoveryTracker.jsx`, `src/components/ui/SizeComparison.jsx`, `src/App.jsx` before making changes.

1. Fact card responsive: desktop slides from right w-96, mobile slides up from bottom h-1/2 full-width.
2. All buttons minimum 44x44px touch targets.
3. UI layout (no overlaps): top-left BackButton, top-right VolumeControl, bottom-center TimeSlider, right-center ModeToggle, right/bottom FactCard, bottom-left DiscoveryTracker, top-center SizeComparison.
4. Minimum font 14px. Fact card names 24px.
5. Add aria-labels to all buttons.

Verification: `npm run build` succeeds.

### Step 17: Final Polish

Read `src/App.jsx`, `src/components/Planet.jsx`, `src/components/CameraController.jsx`, all UI components before making changes.

1. Planet name labels: Html from drei, visible when camera > 80 from origin, text-xs opacity 0.6. Hidden when zoomed in or body selected.
2. Selected planet highlight: RingGeometry slightly larger, emissive material, pulsing opacity.
3. Loading experience: "Solar System Explorer" title screen, fades out after 2 seconds.
4. Smooth CSS transitions on all UI elements.
5. WebGL context loss handler: event listener for 'webglcontextlost', friendly message with reload button.

Verification: `npm run build` succeeds.

### Step 18: Build and Deployment

1. Run `npm run build`, fix all errors.
2. Create `iframe-test.html` in project root (see CLAUDE.md for iframe embed code).
3. Update `vite.config.js`: base './', CSP headers for frame-ancestors.
4. Create `README.md`: project description, setup instructions, texture download links, build/deploy notes, credits, tech stack.
5. Final `npm run build` must succeed with zero errors.

Verification: `npm run build` succeeds. All features compile.
