import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { RADII, ROTATION_SPEEDS, FALLBACK_COLORS } from '../utils/scaleConfig'

const SUN_RADIUS = RADII.sun          // 8.0 scene units
const GLOW_RADIUS = SUN_RADIUS * 1.2  // Outer glow sphere
const SUN_COLOR = FALLBACK_COLORS.sun // #FDB813

/**
 * The Sun — self-lit sphere (MeshBasicMaterial, no lighting needed) plus:
 *  - A slightly larger back-facing glow sphere with additive blending
 *  - A PointLight at origin that lights all planets
 *
 * MeshBasicMaterial is correct here: the Sun IS the light source.
 * MeshStandardMaterial would make it look dark unless lit from outside.
 */
export default function Sun() {
  const meshRef = useRef()

  // Self-rotate the Sun slowly
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += ROTATION_SPEEDS.sun * delta
    }
  })

  return (
    <group>
      {/* Main Sun sphere — self-lit, no shadow */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[SUN_RADIUS, 64, 64]} />
        <meshBasicMaterial color={SUN_COLOR} />
      </mesh>

      {/* Glow halo — slightly larger, back-face only, additive blending */}
      {/* BackSide means only the inside of the sphere is drawn, giving a halo effect */}
      <mesh>
        <sphereGeometry args={[GLOW_RADIUS, 64, 64]} />
        <meshBasicMaterial
          color="#FFA500"
          transparent
          opacity={0.15}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Point light — illuminates all planets from the Sun's position */}
      <pointLight
        position={[0, 0, 0]}
        intensity={2}
        color="white"
        decay={0}
      />
    </group>
  )
}
