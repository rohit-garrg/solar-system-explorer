import { useRef, useCallback, Suspense, Component } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture, Html } from '@react-three/drei'
import * as THREE from 'three'
import { RADII, ROTATION_SPEEDS, FALLBACK_COLORS, SIZE_VS_EARTH } from '../utils/scaleConfig'
import useStore from '../stores/useStore'

const SUN_RADIUS = RADII.sun          // 8.0 scene units
const GLOW_RADIUS = SUN_RADIUS * 1.2  // Outer glow sphere
const SUN_COLOR = FALLBACK_COLORS.sun  // #FDB813
const SUN_TEXTURE_PATH = '/textures/sun.jpg'

// In comparison mode, slide the Sun off to the left so it's partially visible
const SUN_COMP_X = -30

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

// Reusable Vector3 for lerp target
const _sunTarget = new THREE.Vector3()

/**
 * The Sun -- self-lit sphere (MeshBasicMaterial, no lighting needed) plus:
 *  - Optional texture via Suspense/ErrorBoundary
 *  - A slightly larger back-facing glow sphere with additive blending
 *  - A PointLight at origin that lights all planets
 *
 * Clickable -- selects 'sun' in the store to show its fact card.
 *
 * In size comparison mode: slides to X=-30 (partially off-screen left)
 * so it doesn't block planet clicks. The invisible click mesh is hidden
 * in comparison mode to prevent it from catching planet clicks near origin.
 */
export default function Sun() {
  const groupRef = useRef()
  const mainGroupRef = useRef()
  const sizeComparisonMode = useStore((s) => s.sizeComparisonMode)

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += ROTATION_SPEEDS.sun * delta
    }

    // Lerp position for size comparison mode transition
    if (mainGroupRef.current) {
      const targetX = sizeComparisonMode ? SUN_COMP_X : 0
      _sunTarget.set(targetX, 0, 0)
      mainGroupRef.current.position.lerp(_sunTarget, 0.05)
    }
  })

  const handleClick = useCallback((e) => {
    e.stopPropagation()
    const store = useStore.getState()
    if (store.spacecraftMode && !store.isFlying) {
      store.setFlightTarget('sun')
      store.setIsFlying(true)
    } else if (!store.spacecraftMode) {
      store.selectBody('sun')
    }
  }, [])

  const handlePointerOver = useCallback((e) => {
    e.stopPropagation()
    document.body.style.cursor = 'pointer'
  }, [])

  const handlePointerOut = useCallback(() => {
    document.body.style.cursor = 'auto'
  }, [])

  return (
    <group ref={mainGroupRef}>
      {/* Rotating group for the Sun sphere — click events on the visible sphere */}
      <group
        ref={groupRef}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <SunTextureBoundary fallback={<FallbackSunSphere />}>
          <Suspense fallback={<FallbackSunSphere />}>
            <TexturedSunSphere />
          </Suspense>
        </SunTextureBoundary>
      </group>

      {/* Invisible expanded click target — only in normal mode.
          In comparison mode this sphere at origin would overlap planets
          near X=0 and steal their clicks. */}
      {!sizeComparisonMode && (
        <mesh
          visible={false}
          onClick={handleClick}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
        >
          <sphereGeometry args={[SUN_RADIUS, 16, 16]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      )}

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

      {/* Size comparison label */}
      {sizeComparisonMode && (
        <Html
          position={[0, -(SUN_RADIUS + 2), 0]}
          center
          style={{
            color: 'white',
            fontSize: '11px',
            fontFamily: 'system-ui, sans-serif',
            textAlign: 'center',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            userSelect: 'none',
            textShadow: '0 1px 3px rgba(0,0,0,0.8)',
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Sun</div>
          <div style={{ opacity: 0.7, fontSize: '10px' }}>109x Earth</div>
        </Html>
      )}
    </group>
  )
}
