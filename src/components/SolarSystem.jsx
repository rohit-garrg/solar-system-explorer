import { useFrame } from '@react-three/fiber'
import Sun from './Sun'
import Starfield from './Starfield'
import Planet from './Planet'
import OrbitLine from './OrbitLine'
import AsteroidBelt from './AsteroidBelt'
import Comet from './Comet'
import Spacecraft from './Spacecraft'
import PostcardCaptureTrigger from './PostcardCaptureTrigger'
import PerformanceMonitor from './PerformanceMonitor'
import useStore from '../stores/useStore'
import planetsData from '../data/planets.json'
import cometsData from '../data/comets.json'
import { DISTANCES, INITIAL_ANGLES } from '../utils/scaleConfig'

/**
 * Main 3D scene -- renders all celestial bodies inside the R3F Canvas.
 *
 * TimeTicker is the ONLY place that advances elapsedTime in the Zustand store.
 * All other components read elapsedTime but never write it.
 *
 * INITIAL_ANGLES comes from scaleConfig (single source of truth) -- spreads
 * planets evenly so they're visible from the default camera at startup.
 *
 * In size comparison mode, orbit lines, asteroid belt, and comets are hidden
 * to reduce visual clutter while planets line up by size.
 */

/**
 * TimeTicker -- advances the simulation's elapsedTime every frame.
 * Must live inside Canvas (needs useFrame). Returns null (no visual output).
 *
 * Uses getState() + setState() directly to avoid triggering React renders --
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
  const sizeComparisonMode = useStore((s) => s.sizeComparisonMode)

  return (
    <group>
      {/* Very low ambient so planet dark sides aren't pitch black */}
      <ambientLight intensity={sizeComparisonMode ? 0.4 : 0.1} />

      {/* Sun -- self-lit sphere + point light that illuminates planets */}
      <Sun />

      {/* Background star field */}
      <Starfield />

      {/* Orbit lines, asteroid belt, comets -- hidden in size comparison mode */}
      {!sizeComparisonMode && (
        <>
          {planetsData.map((planet) => (
            <OrbitLine
              key={`orbit-${planet.key}`}
              distance={DISTANCES[planet.key]}
            />
          ))}

          <AsteroidBelt />

          {cometsData.map((comet) => (
            <Comet key={comet.key} cometData={comet} />
          ))}
        </>
      )}

      {/* Planets -- always rendered (handle their own comparison mode transition) */}
      {planetsData.map((planet) => (
        <Planet
          key={planet.key}
          planetKey={planet.key}
          initialAngle={INITIAL_ANGLES[planet.key]}
        />
      ))}

      {/* Spacecraft -- visible only in spacecraft mode */}
      <Spacecraft />

      {/* Advance simulation time each frame */}
      <TimeTicker />

      {/* Postcard screenshot trigger (captures canvas on request) */}
      <PostcardCaptureTrigger />

      {/* FPS monitoring -- adjusts qualityLevel in the store */}
      <PerformanceMonitor />
    </group>
  )
}
