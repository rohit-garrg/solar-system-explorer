# CHUNK 3 Implementation Plan (Steps 9-13)

## Current State Summary
Steps 1-8 complete. Codebase has: Sun, 9 planets, 12 moons, orbit lines, time controls, fact cards, camera animation, click handling, textures with fallbacks, Saturn rings, Earth/Venus clouds.

## Step 9: Asteroid Belt and Comets

### 9A: AsteroidBelt.jsx
- InstancedMesh with IcosahedronGeometry(1, 0)
- Count from qualityLevel: high=500, medium=200, low=100
- Random position in torus: angle 0-2pi, radius 38-46 (ASTEROID_BELT config in scaleConfig), Y offset -1.5 to +1.5
- Random scale 0.03-0.12
- Random gray-brown instanceColor (R:0.35-0.55, G:0.30-0.50, B:0.25-0.45)
- Rotate entire group: rotation.y = ASTEROID_BELT.rotationSpeed * elapsedTime (absolute time)
- Use useEffect to populate instance matrices after mount
- Set instanceMatrix.needsUpdate = true

### 9B: Comet.jsx
- Props: { cometData } from comets.json
- Position via ellipticalOrbitPosition() from orbitMath.js each frame
- Body: sphere radius 0.15, MeshBasicMaterial color #E8F4FD (self-lit)
- Tail: ConeGeometry pointing AWAY from Sun
  - Direction = normalize(cometPosition) (Sun at origin)
  - Tail length = min(maxTailLength, max(0.5, maxTailLength * 30 / distToSun))
  - Position tail center at awayDir * (bodyRadius + tailLen/2) from comet
  - Orient cone: +Y tip toward body, base extends away from Sun
  - Material: MeshBasicMaterial, #B0D8FF, transparent, opacity 0.4, AdditiveBlending, depthWrite false
- Allocate reusable Vector3/Quaternion objects OUTSIDE useFrame
- Click handling with hit area (radius 0.15 < 0.5, hitRadius = 0.5)

### 9C: Add comet facts to facts.json
- Add "halley" and "hale-bopp" entries with 3-5 kid-friendly facts each
- Keep comets out of TOTAL_BODIES count (stays at 22)

### 9D: Wire into SolarSystem.jsx
- Import AsteroidBelt and Comet
- Import cometsData from data/comets.json
- Render after planets

### 9E: Update orbitMath.js getBodyWorldPosition for comets
- Import cometsData, check if bodyKey matches a comet
- If so, call ellipticalOrbitPosition with comet params

### Order: AsteroidBelt.jsx -> Comet.jsx -> facts.json -> orbitMath.js -> SolarSystem.jsx -> build

---

## Step 10: Spacecraft Mode

### 10A: Spacecraft.jsx
- Rocket from ConeGeometry (nose, red #CC3333) + CylinderGeometry (body, white #EEEEEE) + BoxGeometry (fins, gray #444444)
- ~0.5 scene units tall
- Only visible when spacecraftMode === true
- Export spacecraftPositionRef for camera to read

### Flight mechanics:
- When spacecraftMode && click planet: set flightTarget + isFlying
- Quadratic bezier: start -> control (midpoint + 20Y) -> target
- Duration: 3 seconds, t = elapsed / 3.0
- Compute fixed end position at flight start (predicted position)
- Orient rocket along flight direction (lookAt next point)
- On arrival: setIsFlying(false), selectBody(target), markVisited(target)
- Idle: follow selected body with slight offset

### Trail: Simple approach with Points or Line, 20 positions in ring buffer

### 10B: ModeToggle.jsx
- Rocket emoji button, fixed right side, toggles spacecraftMode
- Blue when active, dark when inactive

### 10C: Modify click handlers for spacecraft mode
- In Planet.jsx, Moon.jsx, Sun.jsx: when spacecraftMode && !isFlying, set flightTarget instead of selectBody

### 10D: DiscoveryTracker.jsx
- "Explored N of 22 worlds" counter, fixed bottom-left
- Load/save visitedBodies from localStorage (already in store)
- Congrats overlay when count >= TOTAL_BODIES

### 10E: Camera follows spacecraft
- In useCameraAnimation.js: when isFlying, read spacecraftPositionRef, follow in third-person
- Don't override camera during flight

### 10F: Wire into SolarSystem.jsx and App.jsx

### Order: ModeToggle -> DiscoveryTracker -> Spacecraft -> click handlers -> camera -> SolarSystem -> App.jsx -> build

---

## Step 11: Audio Integration

### 11A: useAudio.js hook
- Creates Howl instances for: ambient loop, planet tones, SFX (whoosh, arrive, click)
- All gated by audioEnabled and masterVolume
- Graceful error handling for missing files (try/catch, onloaderror callback)
- Tab visibility pause/resume via visibilitychange event
- Functions: playAmbient, stopAmbient, playPlanetTone(key), stopPlanetTone, playSfx(name)

### 11B: SoundEnableButton.jsx
- "Turn on Sound" button with speaker icon, fixed top-right
- Calls enableAudio(), disappears after click

### 11C: VolumeControl.jsx
- Only visible after audio enabled (replaces SoundEnableButton position)
- Mute/unmute toggle + hover slider
- Top-right corner

### 11D: AudioManager.jsx (NEW file, not a placeholder)
- Non-visual component, rendered in App.jsx
- Subscribes to store: audioEnabled -> playAmbient, selectedBody -> playPlanetTone, isFlying -> playSfx

### 11E: Wire into App.jsx + add playSfx('click') to FactCard's handleNextFact

### Order: useAudio.js -> SoundEnableButton -> VolumeControl -> AudioManager -> App.jsx -> FactCard -> build

---

## Step 12: Constellations and Starfield Polish

### 12A: Create constellations.json (NEW file)
- 8 constellations: Big Dipper, Orion, Cassiopeia, Leo, Scorpius, Southern Cross, Canis Major, Cygnus
- Each: name, description, stars [{x,y,z}] on sphere radius 490, lines [[idx,idx]]

### 12B: Enhance Starfield.jsx
- Split into DimStars (1800, size 0.3) + BrightStars (200, size 0.8-1.2) + Constellations
- Twinkling: animate color buffer of bright stars with sin(time * freq + phase) in useFrame
- Named bright stars: Sirius (blue-white), Polaris (white), Betelgeuse (reddish)

### 12C: Constellation rendering
- Line from drei for each constellation line segment, white, opacity 0.08
- Html from drei for labels at constellation centroids
- Only visible when camera distance > 100 (check in useFrame)

### Order: constellations.json -> Starfield refactor -> twinkling -> constellations -> build

---

## Step 13: Size Comparison Mode

### 13A: Add to scaleConfig.js
- SIZE_COMPARISON_ORDER = ['jupiter','saturn','uranus','neptune','earth','venus','mars','mercury','pluto']
- SIZE_COMPARISON_POSITIONS: computed X positions spaced by radius + padding

### 13B: SizeComparison.jsx (UI toggle)
- Fixed top-center, toggles sizeComparisonMode

### 13C: Planet.jsx comparison mode
- Add offsetGroupRef
- When sizeComparisonMode: lerp outerGroup rotation to 0, lerp offset position to lineup position
- When exiting: lerp back to orbital position [distance, 0, 0]
- Html labels below each planet: name + "Nx Earth"
- Hide moons in comparison mode

### 13D: Camera for comparison
- In useCameraAnimation: when sizeComparisonMode, lerp camera to [0, 10, 50] looking at [0, 0, 0]

### 13E: Hide clutter in comparison mode
- SolarSystem.jsx: hide orbit lines, asteroid belt, comets when sizeComparisonMode

### 13F: toggleSizeComparison already pauses orbits in store

### Order: scaleConfig -> SizeComparison.jsx -> Planet.jsx -> useCameraAnimation -> SolarSystem.jsx -> App.jsx -> build

---

## New Files to Create
- src/data/constellations.json (Step 12)
- src/components/AudioManager.jsx (Step 11)

## Files Modified Per Step
- Step 9: AsteroidBelt.jsx, Comet.jsx, facts.json, orbitMath.js, SolarSystem.jsx
- Step 10: Spacecraft.jsx, ModeToggle.jsx, DiscoveryTracker.jsx, Planet.jsx, Moon.jsx, Sun.jsx, useCameraAnimation.js, SolarSystem.jsx, App.jsx
- Step 11: useAudio.js, SoundEnableButton.jsx, VolumeControl.jsx, AudioManager.jsx(new), App.jsx, FactCard.jsx
- Step 12: constellations.json(new), Starfield.jsx
- Step 13: scaleConfig.js, SizeComparison.jsx, Planet.jsx, useCameraAnimation.js, SolarSystem.jsx, App.jsx
