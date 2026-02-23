import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import Sun from './Sun'
import Starfield from './Starfield'
import Planet from './Planet'
import useStore from '../stores/useStore'
import planetsData from '../data/planets.json'

/**
 * Main 3D scene — renders all celestial bodies inside the Canvas.
 *
 * This is also the single place that advances elapsedTime in the Zustand store.
 * Only SolarSystem ticks time forward — other components just read elapsedTime.
 *
 * Spread planets at even initial angles so they're visible from the default
 * camera position at startup (avoids all 9 planets clustering on one side).
 */

// Spread planets evenly around their orbits at startup
const PLANET_KEYS = planetsData.map(p => p.key)
const INITIAL_ANGLES = PLANET_KEYS.reduce((acc, key, i) => {
  acc[key] = (i / PLANET_KEYS.length) * Math.PI * 2
  return acc
}, {})

// Time ticker — lives inside a child component so it can use useFrame.
// Placed here (not in a separate file) to keep the scene self-contained.
function TimeTicker() {
  const setStore = useStore((s) => s)

  useFrame((_, delta) => {
    const { isPaused, timeSpeed } = useStore.getState()
    if (!isPaused) {
      const current = useStore.getState().elapsedTime
      useStore.setState({ elapsedTime: current + delta * timeSpeed })
    }
  })

  return null
}

export default function SolarSystem() {
  return (
    <group>
      {/* Minimal ambient so planet dark sides aren't completely black */}
      <ambientLight intensity={0.1} />

      {/* The Sun — self-lit + point light illuminating all planets */}
      <Sun />

      {/* Background stars */}
      <Starfield />

      {/* Planets — each at a spread initial angle */}
      {planetsData.map((planet) => (
        <Planet
          key={planet.key}
          planetKey={planet.key}
          initialAngle={INITIAL_ANGLES[planet.key]}
        />
      ))}

      {/* Time advancement — the single place that ticks elapsedTime */}
      <TimeTicker />
    </group>
  )
}
