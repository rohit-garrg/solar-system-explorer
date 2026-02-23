import { useRef, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import { MOONS, getHitRadius } from '../utils/scaleConfig'
import useStore from '../stores/useStore'

const MOON_SELF_ROTATION = 0.02  // Slow self-spin for all moons

/**
 * Moon -- orbits its parent planet within the planet's tilt group.
 * Inherits the parent planet's orbital + tilt position via scene graph.
 *
 * Scene graph within tilt group:
 *   <orbitalGroup>         -- Y-rotation at moon's orbital speed * elapsedTime
 *     <offsetGroup>        -- position=[orbitDistance, 0, 0]
 *       <mesh>             -- visible sphere (fallback color, 32 segments)
 *       <hitMesh>          -- invisible expanded tap target
 *
 * All moons have radius < 0.5, so all get expanded hit areas.
 *
 * Props:
 *   moonKey       {string} -- key matching MOONS[key] in scaleConfig (e.g. "io")
 *   fallbackColor {string} -- hex color for the sphere
 */
export default function Moon({ moonKey, fallbackColor = '#888888' }) {
  const orbitalRef = useRef()
  const meshRef = useRef()

  const config = MOONS[moonKey]
  if (!config) return null

  const { radius, orbitDistance, orbitSpeed } = config

  // All moons are small -- always use expanded hit area
  const hitRadius = getHitRadius(radius)

  const handleClick = useCallback((e) => {
    e.stopPropagation()
    useStore.getState().selectBody(moonKey)
  }, [moonKey])

  const handlePointerOver = useCallback((e) => {
    e.stopPropagation()
    document.body.style.cursor = 'pointer'
  }, [])

  const handlePointerOut = useCallback(() => {
    document.body.style.cursor = 'auto'
  }, [])

  useFrame((_, delta) => {
    if (!orbitalRef.current) return

    const { elapsedTime, timeSpeed, isPaused } = useStore.getState()

    // Moon orbital position -- absolute time, no drift
    orbitalRef.current.rotation.y = orbitSpeed * elapsedTime

    // Slow self-rotation
    if (meshRef.current && !isPaused) {
      meshRef.current.rotation.y += MOON_SELF_ROTATION * delta * timeSpeed
    }
  })

  return (
    <group ref={orbitalRef}>
      <group position={[orbitDistance, 0, 0]}>

        {/* Moon sphere */}
        <mesh ref={meshRef}>
          <sphereGeometry args={[radius, 32, 32]} />
          <meshStandardMaterial color={fallbackColor} />
        </mesh>

        {/* Invisible expanded hit area -- all moons need this */}
        <mesh
          visible={false}
          onClick={handleClick}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
        >
          <sphereGeometry args={[hitRadius, 16, 16]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>

      </group>
    </group>
  )
}
