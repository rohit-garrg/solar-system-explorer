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
      <ambientLight intensity={sizeComparisonMode ? 0.8 : 0.1} />
      <Sun />
      <TimeTicker />

      {/* DEBUG: uncomment components one by one to find the crash */}
      <Starfield />
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

      {planetsData.map((planet) => (
        <Planet
          key={planet.key}
          planetKey={planet.key}
          initialAngle={INITIAL_ANGLES[planet.key]}
        />
      ))}

      <Spacecraft />
      <PostcardCaptureTrigger />
      <PerformanceMonitor />
    </group>
  )
}
