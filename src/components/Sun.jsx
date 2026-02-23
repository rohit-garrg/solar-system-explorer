import { useRef, useCallback, Suspense, Component } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { RADII, ROTATION_SPEEDS, FALLBACK_COLORS } from '../utils/scaleConfig'
import useStore from '../stores/useStore'

const SUN_RADIUS = RADII.sun          // 8.0 scene units
const GLOW_RADIUS = SUN_RADIUS * 1.2  // Outer glow sphere
const SUN_COLOR = FALLBACK_COLORS.sun  // #FDB813
const SUN_TEXTURE_PATH = '/textures/sun.jpg'

/**
 * TextureErrorBoundary for the Sun -- catches texture load failures
 * so the Sun falls back to its solid color.
 */
class SunTextureBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(error) {
    console.warn('Sun texture load failed:', error.message)
  }
  render() {
    if (this.state.hasError) return this.props.fallback
    return this.props.children
  }
}

/**
 * Textured Sun sphere -- MeshBasicMaterial (self-lit, NOT MeshStandard).
 */
function TexturedSunSphere() {
  const texture = useTexture(SUN_TEXTURE_PATH)
  return (
    <mesh>
      <sphereGeometry args={[SUN_RADIUS, 64, 64]} />
      <meshBasicMaterial map={texture} />
    </mesh>
  )
}

/**
 * Fallback Sun sphere -- solid color, no texture.
 */
function FallbackSunSphere() {
  return (
    <mesh>
      <sphereGeometry args={[SUN_RADIUS, 64, 64]} />
      <meshBasicMaterial color={SUN_COLOR} />
    </mesh>
  )
}

/**
 * The Sun -- self-lit sphere (MeshBasicMaterial, no lighting needed) plus:
 *  - Optional texture via Suspense/ErrorBoundary
 *  - A slightly larger back-facing glow sphere with additive blending
 *  - A PointLight at origin that lights all planets
 *
 * Clickable -- selects 'sun' in the store to show its fact card.
 */
export default function Sun() {
  const groupRef = useRef()

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += ROTATION_SPEEDS.sun * delta
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
      {/* Rotating group for the Sun sphere */}
      <group ref={groupRef}>
        <SunTextureBoundary fallback={<FallbackSunSphere />}>
          <Suspense fallback={<FallbackSunSphere />}>
            <TexturedSunSphere />
          </Suspense>
        </SunTextureBoundary>
      </group>

      {/* Invisible click target (in case texture mesh doesn't register events) */}
      <mesh
        visible={false}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <sphereGeometry args={[SUN_RADIUS, 16, 16]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Glow halo -- back-face only, additive blending */}
      <mesh>
        <sphereGeometry args={[GLOW_RADIUS, 64, 64]} />
        <meshBasicMaterial
          color="#FFA500"
          transparent
          opacity={0.15}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Point light -- illuminates all planets */}
      <pointLight
        position={[0, 0, 0]}
        intensity={2}
        color="white"
        decay={0}
      />
    </group>
  )
}
