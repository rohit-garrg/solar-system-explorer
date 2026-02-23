import { useRef, useState, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  RADII,
  DISTANCES,
  ORBITAL_SPEEDS,
  ROTATION_SPEEDS,
  AXIAL_TILTS,
  FALLBACK_COLORS,
  getHitRadius,
} from '../utils/scaleConfig'
import { degToRad } from '../utils/orbitMath'
import useStore from '../stores/useStore'

/**
 * Planet — renders a single planet using the scene graph hierarchy from the spec:
 *
 *   <outerGroup>           -- orbital rotation around Sun (Y-axis, driven by elapsedTime)
 *     <offsetGroup>        -- translates planet to [distance, 0, 0]
 *       <tiltGroup>        -- axial tilt as Z-rotation
 *         <mesh>           -- visible sphere, self-rotates on Y
 *         <hitMesh>        -- invisible expanded tap target (for small planets)
 *
 * Orbital animation uses ABSOLUTE time (orbSpeed * elapsedTime), NOT
 * accumulated delta -- this prevents floating-point drift.
 *
 * Self-rotation uses delta (frame time) scaled by timeSpeed.
 *
 * Props:
 *   planetKey    {string}  -- key matching RADII/DISTANCES/etc. (e.g. "earth")
 *   initialAngle {number}  -- starting orbital angle in radians
 */
export default function Planet({ planetKey, initialAngle = 0 }) {
  const outerGroupRef = useRef()
  const meshRef = useRef()

  const [hovered, setHovered] = useState(false)
  const hoverScale = useRef(1)

  const radius   = RADII[planetKey]
  const distance = DISTANCES[planetKey]
  const orbSpeed = ORBITAL_SPEEDS[planetKey]
  const rotSpeed = ROTATION_SPEEDS[planetKey]
  const tiltDeg  = AXIAL_TILTS[planetKey]
  const color    = FALLBACK_COLORS[planetKey]

  const tiltRad = degToRad(tiltDeg)

  // Does this planet need an expanded hit area?
  const hitRadius = getHitRadius(radius)
  const needsHitArea = hitRadius > radius

  // Click handler — select this planet in the store
  const handleClick = useCallback((e) => {
    e.stopPropagation()
    useStore.getState().selectBody(planetKey)
  }, [planetKey])

  const handlePointerOver = useCallback((e) => {
    e.stopPropagation()
    setHovered(true)
    document.body.style.cursor = 'pointer'
  }, [])

  const handlePointerOut = useCallback(() => {
    setHovered(false)
    document.body.style.cursor = 'auto'
  }, [])

  useFrame((_, delta) => {
    if (!outerGroupRef.current || !meshRef.current) return

    const { elapsedTime, timeSpeed, isPaused } = useStore.getState()

    // Orbital position — absolute time, no drift
    outerGroupRef.current.rotation.y = orbSpeed * elapsedTime + initialAngle

    // Self-rotation — delta-based, scaled by timeSpeed
    if (!isPaused) {
      meshRef.current.rotation.y += rotSpeed * delta * timeSpeed
    }

    // Smooth hover scale lerp (1.0 <-> 1.15)
    const targetScale = hovered ? 1.15 : 1
    hoverScale.current += (targetScale - hoverScale.current) * 0.1
    meshRef.current.scale.setScalar(hoverScale.current)
  })

  return (
    <group ref={outerGroupRef}>
      <group position={[distance, 0, 0]}>
        <group rotation={[0, 0, tiltRad]}>

          {/* Planet sphere */}
          <mesh
            ref={meshRef}
            onClick={handleClick}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
          >
            <sphereGeometry args={[radius, 64, 64]} />
            <meshStandardMaterial color={color} />
          </mesh>

          {/* Invisible expanded hit area for small planets */}
          {needsHitArea && (
            <mesh
              visible={false}
              onClick={handleClick}
              onPointerOver={handlePointerOver}
              onPointerOut={handlePointerOut}
            >
              <sphereGeometry args={[hitRadius, 16, 16]} />
              <meshBasicMaterial transparent opacity={0} />
            </mesh>
          )}

        </group>
      </group>
    </group>
  )
}
