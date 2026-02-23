# PLAN_CHUNK_2.md -- Implementation Plan for Steps 5-8

## Pre-Requisites (Chunk 1 Complete)
- R3F Canvas at 100vw x 100vh with camera at [0, 80, 120], fov 45
- Sun with MeshBasicMaterial #FDB813, glow halo, pointLight
- 9 planets with fallback colors, axial tilt, self-rotation, animated orbits
- Orbit lines (white, opacity 0.15)
- Starfield (2000 points)
- Zustand store with complete schema
- orbitMath.js with circular and elliptical orbit functions
- scaleConfig.js with all values
- TimeTicker advancing elapsedTime in SolarSystem.jsx
- facts.json already populated with Sun + 9 planets + 12 moons

## STEP 5: Click to Select + Fact Cards

### 5.1 Add INITIAL_ANGLES to scaleConfig.js
Add export at the end:
```javascript
const PLANET_ORDER = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto']
export const INITIAL_ANGLES = PLANET_ORDER.reduce((acc, key, i) => {
  acc[key] = (i / PLANET_ORDER.length) * Math.PI * 2
  return acc
}, {})
```

### 5.2 Add getBodyWorldPosition to orbitMath.js
```javascript
import { RADII, DISTANCES, ORBITAL_SPEEDS, MOONS, INITIAL_ANGLES } from './scaleConfig'

export function getBodyWorldPosition(bodyKey, elapsedTime) {
  if (bodyKey === 'sun') return [0, 0, 0]

  if (DISTANCES[bodyKey] !== undefined) {
    const angle = ORBITAL_SPEEDS[bodyKey] * elapsedTime + (INITIAL_ANGLES[bodyKey] || 0)
    return [DISTANCES[bodyKey] * Math.cos(angle), 0, DISTANCES[bodyKey] * Math.sin(angle)]
  }

  // Moon lookup
  for (const [parent, moonList] of Object.entries(MOONS)) {
    const moonConfig = Object.values(MOONS).flat ? undefined : MOONS[bodyKey]
  }
  // Look up moon in MOONS config (MOONS is keyed by moon key, not parent)
  if (MOONS[bodyKey]) {
    const moon = MOONS[bodyKey]
    const parentPos = getBodyWorldPosition(moon.parent, elapsedTime)
    const moonAngle = moon.orbitSpeed * elapsedTime
    return [
      parentPos[0] + moon.orbitDistance * Math.cos(moonAngle),
      parentPos[1],
      parentPos[2] + moon.orbitDistance * Math.sin(moonAngle)
    ]
  }

  return [0, 0, 0]
}
```
NOTE: Check how MOONS is structured in scaleConfig.js before implementing. It might be keyed by parent planet, not by moon key. Adjust lookup accordingly.

### 5.3 Update SolarSystem.jsx
Import INITIAL_ANGLES from scaleConfig instead of computing locally.

### 5.4 Implement useCameraAnimation.js
- Read selectedBody and elapsedTime from store
- When selectedBody changes, compute target camera position (bodyPos + radius*6 offset)
- In useFrame, lerp camera position and OrbitControls target at factor 0.05
- When selectedBody is null, lerp back to default [0,80,120]
- Track the body continuously while selected (update lookAt each frame)
- Receives controlsRef to update OrbitControls target

### 5.5 Update CameraController.jsx
- Add ref to OrbitControls
- Call useCameraAnimation(controlsRef)

### 5.6 Update Planet.jsx - Click + Hover
- onClick on mesh: e.stopPropagation(); store.selectBody(planetKey)
- Invisible hit area mesh for planets with radius < 0.5 (Mercury: hitR=0.95, Pluto: hitR=0.75)
- Hover: useState(hovered), lerp scale 1.0<->1.15 in useFrame
- Cursor pointer on hover

### 5.7 Update Sun.jsx - Click
- onClick: e.stopPropagation(); store.selectBody('sun')
- Cursor pointer on hover

### 5.8 Implement FactCard.jsx
- Reads selectedBody from store, looks up facts.json
- Shows name, random fact, Next Fact button, stats, X dismiss
- Desktop (>768px): fixed right panel w-96, slides from right
- Mobile: bottom sheet h-1/2, slides up
- bg-black/70 backdrop-blur-sm text-white rounded corners
- Use inline style for dynamic transform (Tailwind JIT won't handle dynamic classes)

### 5.9 Implement BackButton.jsx
- Only visible when selectedBody is not null
- Fixed top-left, calls clearSelection()
- Arrow left icon, 48x48px

### 5.10 Update App.jsx
- Import and render FactCard + BackButton in UI overlay div

### Order: scaleConfig -> orbitMath -> SolarSystem -> useCameraAnimation -> CameraController -> Planet -> Sun -> FactCard -> BackButton -> App.jsx -> build

---

## STEP 6: Time Controls

### 6.1 Add range slider CSS to index.css
```css
input[type="range"]::-webkit-slider-thumb {
  width: 24px;
  height: 24px;
}
input[type="range"]::-moz-range-thumb {
  width: 24px;
  height: 24px;
}
```

### 6.2 Implement TimeSlider.jsx
- Fixed bottom center
- Range input: min=0.1 max=20 step=0.1 default=1
- Play/pause button (44x44px min)
- Speed label with current multiplier
- "Fast Forward" text when speed > 5x
- bg-black/60 backdrop-blur-sm rounded-full px-6 py-3

### 6.3 Keyboard shortcuts (in TimeSlider useEffect)
- Space: toggle pause (e.preventDefault to stop scroll)
- ArrowUp: speed +1 (cap at 20)
- ArrowDown: speed -1 (min 0.1)
- Use useStore.getState() to avoid stale closures

### 6.4 Render TimeSlider in App.jsx

### Order: index.css -> TimeSlider -> App.jsx -> build

---

## STEP 7: Textures

### 7.1 TextureErrorBoundary
Create a small class component in Planet.jsx that catches texture loading errors and renders the fallback sphere.

### 7.2 Split Planet.jsx rendering
```jsx
<TextureErrorBoundary fallback={<FallbackSphere radius={r} color={c} />}>
  <Suspense fallback={<FallbackSphere radius={r} color={c} />}>
    <TexturedSphere radius={r} texturePath={path} />
  </Suspense>
</TextureErrorBoundary>
```
Use useTexture from drei. If file doesn't exist, ErrorBoundary catches it.

### 7.3 Refactor mesh ref to spin group
Move self-rotation ref to a parent group ("spinGroup") that contains the planet sphere + cloud layers. Moons go outside the spin group (inside tilt group) so they don't spin with the planet.

### 7.4 Saturn Ring (conditional, planetKey === 'saturn')
- RingGeometry(2.2, 3.8, 64)
- UV fix from CLAUDE.md (remap UVs for linear radial mapping)
- Rotate -PI/2 on X to lie flat in XZ plane
- Semi-transparent gold color, DoubleSide
- Inside tilt group, outside spin group

### 7.5 Earth Clouds (conditional, planetKey === 'earth')
- Second sphere at earthRadius * 1.02
- White, transparent, opacity 0.4, depthWrite false
- Rotates at 1.1x surface speed
- Inside spin group

### 7.6 Venus Clouds (conditional, planetKey === 'venus')
- Sphere at venusRadius * 1.03
- Yellowish-white #F5F0D0, opacity 0.7, depthWrite false
- Inside spin group

### 7.7 Sun.jsx optional texture
Same Suspense/ErrorBoundary pattern. MeshBasicMaterial (not Standard).

### Order: TextureErrorBoundary -> Planet.jsx refactor -> SaturnRing -> EarthClouds -> VenusClouds -> Sun.jsx -> build

---

## STEP 8: Moons

### 8.1 Update moons.json
Add fallbackColor to all entries. Check current format - it may be keyed by parent or be a flat array.

### 8.2 Implement Moon.jsx
- Receives moonKey prop
- Looks up config from MOONS in scaleConfig (radius, orbitDistance, orbitSpeed)
- Scene graph: orbitalGroup (Y-rotation at orbitSpeed * elapsedTime) > offsetGroup (position=[orbitDist,0,0]) > mesh
- Fallback color sphere, 32 segments
- Slow self-rotation (0.02 rad/s)
- onClick, hit area expansion (all moons have radius < 0.5), cursor pointer

### 8.3 Render moons in Planet.jsx
- Import Moon and moonsData
- Inside tilt group, AFTER spin group (moons don't self-rotate with planet)
- Filter moonsData by parent planet key
- {(moonsData[planetKey] || []).map(m => <Moon key={m.key} moonKey={m.key} />)}

### 8.4 Moon visibility optimization
- In Planet.jsx useFrame: every 30 frames, check camera distance to planet
- If distance > planet.distance * 0.3, hide moons
- Use ref + state combo to avoid excess re-renders

### 8.5 Camera focus for moons
- useCameraAnimation already handles moons via getBodyWorldPosition
- Add minimum focus distance: Math.max(radius * 6, 3) for small bodies

### Order: moons.json -> Moon.jsx -> Planet.jsx (render moons) -> visibility opt -> camera fix -> build

---

## Key Values Reference

**Hit Areas:** For radius < 0.5: hitRadius = max(radius * 2.5, 0.5)
**Camera focus:** radius * 6 (min 3 for moons)
**Saturn Ring:** inner=2.2, outer=3.8
**Earth clouds:** radius * 1.02, opacity 0.4, 1.1x rotation
**Venus clouds:** radius * 1.03, opacity 0.7, #F5F0D0
