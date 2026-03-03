import { useRef, useCallback, memo, Suspense, Component } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { MOONS, getHitRadius } from '../utils/scaleConfig'
import useStore from '../stores/useStore'

/**
 * MoonTextureErrorBoundary -- catches texture load failures (e.g. 404 for moons
 * without texture files on disk) so the moon renders with its solid fallback color.
 */
class MoonTextureErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(error) {
    console.warn(`Moon texture load failed for ${this.props.name || 'moon'}:`, error.message)
  }
  render() {
    if (this.state.hasError) return this.props.fallback
    return this.props.children
  }
}

/**
 * TexturedMoonSphere -- loads a moon texture and applies it to a sphere.
 * Lives inside Suspense so the fallback color shows while loading.
 */
function TexturedMoonSphere({ radius, texturePath, segments }) {
  const texture = useTexture(texturePath)
  return (
    <>
      <sphereGeometry args={[radius, segments, segments]} />
      <meshStandardMaterial map={texture} />
    </>
  )
}

// Look up which moons share a parent, so we can tell if the "selected" body
// is a sibling moon (meaning this moon's system is active and should keep moving).
function isSameSystem(moonKey, selectedBody) {
  if (!selectedBody) return false
  const config = MOONS[moonKey]
  if (!config) return false
  // Selected body is this moon
  if (selectedBody === moonKey) return true
  // Selected body is the parent planet
  if (selectedBody === config.parent) return true
  // Selected body is a sibling moon (same parent)
  const selectedMoon = MOONS[selectedBody]
  if (selectedMoon && selectedMoon.parent === config.parent) return true
  return false
}

const MOON_SELF_ROTATION = 0.02  // Slow self-spin for all moons
const MOON_SEGMENTS = { high: 32, medium: 16, low: 8 }

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
function MoonInner({ moonKey, fallbackColor = '#888888', texturePath }) {
  const orbitalRef = useRef()
  const meshRef = useRef()

  const config = MOONS[moonKey]
  if (!config) return null

  const { radius, orbitDistance, orbitSpeed } = config

  // Quality-adapted segments
  const qualityLevel = useStore((s) => s.qualityLevel)
  const segments = MOON_SEGMENTS[qualityLevel] || 32

  // All moons are small -- always use expanded hit area
  const hitRadius = getHitRadius(radius)

  const handleClick = useCallback((e) => {
    e.stopPropagation()
    const store = useStore.getState()
    if (store.spacecraftMode && !store.isFlying) {
      store.setFlightTarget(moonKey)
      store.setIsFlying(true)
    } else if (!store.spacecraftMode) {
      store.selectBody(moonKey)
    }
  }, [moonKey])

  const handlePointerOver = useCallback((e) => {
    e.stopPropagation()
    document.body.style.cursor = 'pointer'
  }, [])

  const handlePointerOut = useCallback(() => {
    document.body.style.cursor = 'auto'
  }, [])

  // Local time accumulator for the "paused but selected system" case.
  // elapsedTime stops advancing when paused, so we track extra time here.
  const localTimeRef = useRef(0)

  useFrame((_, delta) => {
    if (!orbitalRef.current) return

    const { elapsedTime, timeSpeed, isPaused, selectedBody } = useStore.getState()
    const isRelevant = isSameSystem(moonKey, selectedBody)

    // When paused but this moon's system is active, accumulate local time
    // so orbital motion continues at 1x speed.
    if (isPaused && isRelevant) {
      localTimeRef.current += delta
    } else if (!isPaused) {
      localTimeRef.current = 0
    }

    const effectiveTime = elapsedTime + localTimeRef.current

    // Moon orbital position -- absolute time, no drift
    orbitalRef.current.rotation.y = orbitSpeed * effectiveTime

    // Slow self-rotation
    if (meshRef.current && (!isPaused || isRelevant)) {
      meshRef.current.rotation.y += MOON_SELF_ROTATION * delta * (isPaused ? 1 : timeSpeed)
    }
  })

  return (
    <group ref={orbitalRef}>
      <group position={[orbitDistance, 0, 0]}>

        {/* Moon sphere -- textured if available, solid-color fallback */}
        <mesh ref={meshRef}>
          {texturePath ? (
            <MoonTextureErrorBoundary name={moonKey} fallback={
              <>
                <sphereGeometry args={[radius, segments, segments]} />
                <meshStandardMaterial color={fallbackColor} />
              </>
            }>
              <Suspense fallback={
                <>
                  <sphereGeometry args={[radius, segments, segments]} />
                  <meshStandardMaterial color={fallbackColor} />
                </>
              }>
                <TexturedMoonSphere radius={radius} texturePath={texturePath} segments={segments} />
              </Suspense>
            </MoonTextureErrorBoundary>
          ) : (
            <>
              <sphereGeometry args={[radius, segments, segments]} />
              <meshStandardMaterial color={fallbackColor} />
            </>
          )}
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

const Moon = memo(MoonInner)
export default Moon
