import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  RADII,
  DISTANCES,
  ORBITAL_SPEEDS,
  ROTATION_SPEEDS,
  AXIAL_TILTS,
  FALLBACK_COLORS,
} from '../utils/scaleConfig'
import { degToRad } from '../utils/orbitMath'
import useStore from '../stores/useStore'

/**
 * Planet — renders a single planet using the scene graph hierarchy from the spec:
 *
 *   <outerGroup>           ← orbital rotation around Sun (Y-axis, driven by elapsedTime)
 *     <offsetGroup>        ← translates planet to [distance, 0, 0]
 *       <tiltGroup>        ← axial tilt as Z-rotation
 *         <mesh>           ← visible sphere, self-rotates on Y
 *
 * Orbital animation uses ABSOLUTE time (orbSpeed * elapsedTime), NOT
 * accumulated delta — this prevents floating-point drift and keeps all
 * planets perfectly synced over long sessions.
 *
 * Self-rotation uses delta (frame time) scaled by timeSpeed — we only care
 * about relative spin direction/speed, not an exact absolute angle.
 *
 * Props:
 *   planetKey    {string}  — key matching RADII/DISTANCES/etc. (e.g. "earth")
 *   initialAngle {number}  — starting orbital angle in radians (spreads planets out)
 */
export default function Planet({ planetKey, initialAngle = 0 }) {
  const outerGroupRef = useRef()  // orbital rotation
  const meshRef = useRef()        // self-spin

  const radius   = RADII[planetKey]
  const distance = DISTANCES[planetKey]
  const orbSpeed = ORBITAL_SPEEDS[planetKey]
  const rotSpeed = ROTATION_SPEEDS[planetKey]
  const tiltDeg  = AXIAL_TILTS[planetKey]
  const color    = FALLBACK_COLORS[planetKey]

  // Degrees → radians once (not per frame)
  const tiltRad = degToRad(tiltDeg)

  useFrame((_, delta) => {
    if (!outerGroupRef.current || !meshRef.current) return

    // Read store state directly — avoids triggering React re-renders in useFrame
    const { elapsedTime, timeSpeed, isPaused } = useStore.getState()

    // Orbital position — absolute time formula, no drift
    outerGroupRef.current.rotation.y = orbSpeed * elapsedTime + initialAngle

    // Self-rotation — delta-based, scaled by timeSpeed
    // rotSpeed can be negative (Venus retrograde) — correct behavior
    if (!isPaused) {
      meshRef.current.rotation.y += rotSpeed * delta * timeSpeed
    }
  })

  return (
    // Outer group: Y-rotation drives orbital position around the Sun
    <group ref={outerGroupRef}>

      {/* Offset group: moves planet out to its orbital distance */}
      <group position={[distance, 0, 0]}>

        {/* Tilt group: Z-rotation applies axial tilt to the spin axis */}
        <group rotation={[0, 0, tiltRad]}>

          {/* Planet sphere — MeshStandardMaterial reacts to Sun's pointLight */}
          <mesh ref={meshRef}>
            <sphereGeometry args={[radius, 64, 64]} />
            <meshStandardMaterial color={color} />
          </mesh>

          {/* Moons attach here as children (inherit orbital position automatically) */}

        </group>
      </group>
    </group>
  )
}
