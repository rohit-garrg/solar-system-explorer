import { useRef, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { RADII, ROTATION_SPEEDS, FALLBACK_COLORS } from '../utils/scaleConfig'
import useStore from '../stores/useStore'

const SUN_RADIUS = RADII.sun          // 8.0 scene units
const GLOW_RADIUS = SUN_RADIUS * 1.2  // Outer glow sphere
const SUN_COLOR = FALLBACK_COLORS.sun  // #FDB813

/**
 * The Sun — self-lit sphere (MeshBasicMaterial, no lighting needed) plus:
 *  - A slightly larger back-facing glow sphere with additive blending
 *  - A PointLight at origin that lights all planets
 *
 * Clickable — selects 'sun' in the store to show its fact card.
 */
export default function Sun() {
  const meshRef = useRef()

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += ROTATION_SPEEDS.sun * delta
    }
  })

  const handleClick = useCallback((e) => {
    e.stopPropagation()
    useStore.getState().selectBody('sun')
  }, [])

  const handlePointerOver = useCallback((e) => {
    e.stopPropagation()
    document.body.style.cursor = 'pointer'
  }, [])

  const handlePointerOut = useCallback(() => {
    document.body.style.cursor = 'auto'
  }, [])

  return (
    <group>
      {/* Main Sun sphere — self-lit, clickable */}
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <sphereGeometry args={[SUN_RADIUS, 64, 64]} />
        <meshBasicMaterial color={SUN_COLOR} />
      </mesh>

      {/* Glow halo — slightly larger, back-face only, additive blending */}
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
