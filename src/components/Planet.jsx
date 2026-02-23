import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  RADII,
  DISTANCES,
  ROTATION_SPEEDS,
  AXIAL_TILTS,
  FALLBACK_COLORS,
} from '../utils/scaleConfig'
import { degToRad } from '../utils/orbitMath'

/**
 * Planet — renders a single planet using the scene graph hierarchy from the spec:
 *
 *   <outerGroup>           ← orbital rotation (Y-axis, animated in Step 4)
 *     <offsetGroup>        ← translates planet to [distance, 0, 0]
 *       <tiltGroup>        ← axial tilt as Z-rotation
 *         <mesh>           ← visible sphere, self-rotates on Y
 *         {moons}          ← children of tiltGroup (Step 5)
 *
 * Props:
 *   planetKey  {string}  — key matching RADII/DISTANCES/etc. (e.g. "earth")
 *   initialAngle {number} — starting orbital angle in radians (spread planets out)
 *
 * Step 4 will drive outerGroup.rotation.y from Zustand elapsedTime.
 * For now the planet sits at its initial angle.
 */
export default function Planet({ planetKey, initialAngle = 0 }) {
  const outerGroupRef = useRef()   // orbital rotation
  const meshRef = useRef()         // self-spin

  const radius   = RADII[planetKey]
  const distance = DISTANCES[planetKey]
  const rotSpeed = ROTATION_SPEEDS[planetKey]
  const tiltDeg  = AXIAL_TILTS[planetKey]
  const color    = FALLBACK_COLORS[planetKey]

  // Convert tilt from degrees to radians for Three.js rotation
  const tiltRad = degToRad(tiltDeg)

  // Set initial orbital angle so planets start spread around their orbits
  // (prevents all planets stacking on the same side at t=0)
  // This is applied once as the outer group's initial Y rotation.
  // Step 4 will update this every frame.

  // Self-rotation animation (planet spinning on its own axis)
  useFrame((_, delta) => {
    if (meshRef.current) {
      // rotSpeed can be negative (e.g. Venus retrograde) — that's correct
      meshRef.current.rotation.y += rotSpeed * delta
    }
  })

  return (
    // Outer group: orbits around the Sun (Y-axis rotation)
    // initialAngle offsets the starting position around the orbit
    <group ref={outerGroupRef} rotation={[0, initialAngle, 0]}>

      {/* Middle group: offset from Sun center to orbital distance */}
      <group position={[distance, 0, 0]}>

        {/* Tilt group: axial tilt applied as Z-rotation */}
        {/* Z-rotation tilts the spin axis, matching astronomical convention */}
        <group rotation={[0, 0, tiltRad]}>

          {/* The planet sphere — MeshStandardMaterial reacts to the Sun's pointLight */}
          <mesh ref={meshRef}>
            <sphereGeometry args={[radius, 64, 64]} />
            <meshStandardMaterial color={color} />
          </mesh>

          {/* Moons go here in Step 5 (they inherit the planet's world position) */}

        </group>
      </group>
    </group>
  )
}
