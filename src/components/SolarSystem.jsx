import { useFrame } from '@react-three/fiber'
import Sun from './Sun'
import Starfield from './Starfield'
import Planet from './Planet'
import OrbitLine from './OrbitLine'
import useStore from '../stores/useStore'
import planetsData from '../data/planets.json'
import { DISTANCES } from '../utils/scaleConfig'

/**
 * Main 3D scene — renders all celestial bodies inside the R3F Canvas.
 *
 * TimeTicker is the ONLY place that advances elapsedTime in the Zustand store.
 * All other components read elapsedTime but never write it.
 *
 * Planets are spread at even initial angles so they're visible from the default
 * camera position at startup (prevents all 9 clustering on one side).
 */

// Spread planets evenly around their orbits at startup
const PLANET_KEYS = planetsData.map((p) => p.key)
const INITIAL_ANGLES = PLANET_KEYS.reduce((acc, key, i) => {
  acc[key] = (i / PLANET_KEYS.length) * Math.PI * 2
  return acc
}, {})

/**
 * TimeTicker — advances the simulation's elapsedTime every frame.
 * Must live inside Canvas (needs useFrame). Returns null (no visual output).
 *
 * Uses getState() + setState() directly to avoid triggering React renders —
 * useFrame runs outside React's rendering cycle, so direct Zustand state
 * mutation is the correct pattern here.
 */
function TimeTicker() {
  useFrame((_, delta) => {
    const { isPaused, timeSpeed } = useStore.getState()
    if (!isPaused) {
      useStore.setState((s) => ({ elapsedTime: s.elapsedTime + delta * timeSpeed }))
    }
  })
  return null
}

export default function SolarSystem() {
  return (
    <group>
      {/* Very low ambient so planet dark sides aren't pitch black */}
      <ambientLight intensity={0.1} />

      {/* Sun — self-lit sphere + point light that illuminates planets */}
      <Sun />

      {/* Background star field */}
      <Starfield />

      {/* Orbit lines — faint circles showing each planet's orbital path */}
      {planetsData.map((planet) => (
        <OrbitLine
          key={`orbit-${planet.key}`}
          distance={DISTANCES[planet.key]}
        />
      ))}

      {/* Planets — each at a spread initial angle, orbit animates via elapsedTime */}
      {planetsData.map((planet) => (
        <Planet
          key={planet.key}
          planetKey={planet.key}
          initialAngle={INITIAL_ANGLES[planet.key]}
        />
      ))}

      {/* Advance simulation time each frame */}
      <TimeTicker />
    </group>
  )
}
