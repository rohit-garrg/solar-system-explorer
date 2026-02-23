import { useRef, useState, useCallback, useMemo, memo, Suspense, Component } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture, Html } from '@react-three/drei'
import * as THREE from 'three'
import {
  RADII,
  DISTANCES,
  ORBITAL_SPEEDS,
  ROTATION_SPEEDS,
  AXIAL_TILTS,
  FALLBACK_COLORS,
  SATURN_RING,
  SIZE_COMPARISON_POSITIONS,
  SIZE_VS_EARTH,
  getHitRadius,
} from '../utils/scaleConfig'
import { degToRad } from '../utils/orbitMath'
import useStore from '../stores/useStore'
import planetsData from '../data/planets.json'
import moonsData from '../data/moons.json'
import Moon from './Moon'

/**
 * TextureErrorBoundary -- catches texture load failures so the planet
 * falls back to its solid color without crashing the app.
 */
class TextureErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error) {
    console.warn(`Texture load failed for ${this.props.name || 'planet'}:`, error.message)
  }

  render() {
    if (this.state.hasError) return this.props.fallback
    return this.props.children
  }
}

// Sphere segment counts by quality level
const SEGMENTS_BY_QUALITY = { high: 64, medium: 32, low: 16 }

/**
 * TexturedSphere -- loads a texture via useTexture (drei) and applies it
 * to a sphere. Lives inside Suspense so the fallback shows while loading.
 */
function TexturedSphere({ radius, texturePath, segments = 64 }) {
  const texture = useTexture(texturePath)
  return (
    <mesh>
      <sphereGeometry args={[radius, segments, segments]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  )
}

/**
 * FallbackSphere -- simple colored sphere used before textures load
 * or when texture loading fails.
 */
function FallbackSphere({ radius, color, segments = 64 }) {
  return (
    <mesh>
      <sphereGeometry args={[radius, segments, segments]} />
      <meshStandardMaterial color={color} />
    </mesh>
  )
}

/**
 * Saturn's ring -- RingGeometry with UV fix for proper texture mapping.
 * Rotated -PI/2 on X to lie flat in the XZ plane.
 * Goes inside the tilt group but OUTSIDE the spin group.
 */
function SaturnRing() {
  const { innerRadius, outerRadius } = SATURN_RING

  const geometry = useMemo(() => {
    const geo = new THREE.RingGeometry(innerRadius, outerRadius, 64)
    // UV fix: Three.js RingGeometry generates radial UVs that distort textures.
    // Remap so U goes linearly from inner to outer edge.
    const pos = geo.attributes.position
    const uv = geo.attributes.uv
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i)
      const dist = Math.sqrt(x * x + y * y)
      uv.setXY(i, (dist - innerRadius) / (outerRadius - innerRadius), 0.5)
    }
    return geo
  }, [innerRadius, outerRadius])

  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]}>
      <meshStandardMaterial
        color="#D4BE8D"
        transparent
        opacity={0.7}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}

/**
 * Cloud layer -- a slightly larger transparent sphere for Earth or Venus.
 * Rotates independently (cloudRotMult * base rotation speed).
 * Goes inside the spin group so it rotates with the planet body.
 */
function CloudLayer({ radius, cloudRadiusScale, opacity, color, rotSpeed, cloudRotMult = 1, segments = 64 }) {
  const cloudRef = useRef()
  const cloudRadius = radius * cloudRadiusScale

  useFrame((_, delta) => {
    if (!cloudRef.current) return
    const { timeSpeed, isPaused } = useStore.getState()
    if (!isPaused) {
      cloudRef.current.rotation.y += rotSpeed * cloudRotMult * delta * timeSpeed
    }
  })

  return (
    <mesh ref={cloudRef}>
      <sphereGeometry args={[cloudRadius, segments, segments]} />
      <meshStandardMaterial
        color={color}
        transparent
        opacity={opacity}
        depthWrite={false}
      />
    </mesh>
  )
}

// Pre-allocate a Vector3 for comparison mode lerping
const _compTarget = new THREE.Vector3()

/**
 * Planet -- renders a single planet using the scene graph hierarchy:
 *
 *   <outerGroup>           -- orbital rotation around Sun (Y-axis)
 *     <offsetGroup>        -- translates planet to [distance, 0, 0]
 *       <tiltGroup>        -- axial tilt as Z-rotation
 *         <spinGroup>      -- self-rotation (contains planet mesh + clouds)
 *           <mesh>         -- visible sphere (textured or fallback color)
 *           <CloudLayer>   -- optional (Earth, Venus)
 *         <SaturnRing />   -- optional (Saturn, outside spin group)
 *         <hitMesh>        -- invisible expanded tap target
 *         {moons}          -- rendered here later (outside spin group)
 *
 * In size comparison mode:
 *   - outerGroup rotation lerps to 0 (no orbiting)
 *   - offsetGroup position lerps to the lineup X position at Y=0, Z=0
 *   - Moons are hidden
 *   - Html label shows planet name + "Nx Earth"
 *
 * Orbital animation: absolute time (orbSpeed * elapsedTime + initialAngle).
 * Self-rotation: delta-based, scaled by timeSpeed.
 */
function PlanetInner({ planetKey, initialAngle = 0 }) {
  const outerGroupRef = useRef()
  const offsetGroupRef = useRef()
  const spinGroupRef = useRef()
  const moonsGroupRef = useRef()
  const highlightRef = useRef()
  const frameCounter = useRef(0)

  const [hovered, setHovered] = useState(false)
  const [showLabel, setShowLabel] = useState(false)
  const hoverScale = useRef(1)

  const radius   = RADII[planetKey]
  const distance = DISTANCES[planetKey]
  const orbSpeed = ORBITAL_SPEEDS[planetKey]
  const rotSpeed = ROTATION_SPEEDS[planetKey]
  const tiltDeg  = AXIAL_TILTS[planetKey]
  const color    = FALLBACK_COLORS[planetKey]

  const tiltRad = degToRad(tiltDeg)

  // Look up planet data from JSON for texture paths
  const planetInfo = planetsData.find((p) => p.key === planetKey) || {}

  // Does this planet need an expanded hit area?
  const hitRadius = getHitRadius(radius)
  const needsHitArea = hitRadius > radius

  // Does this planet have moons?
  const hasMoons = (moonsData[planetKey] || []).length > 0

  // Quality-adapted sphere segments
  const qualityLevel = useStore((s) => s.qualityLevel)
  const segments = SEGMENTS_BY_QUALITY[qualityLevel] || 64

  // Size comparison lineup position for this planet
  const compPos = SIZE_COMPARISON_POSITIONS[planetKey]
  const sizeLabel = SIZE_VS_EARTH[planetKey]

  const handleClick = useCallback((e) => {
    e.stopPropagation()
    const store = useStore.getState()
    if (store.sizeComparisonMode) return // No clicking in comparison mode
    if (store.spacecraftMode && !store.isFlying) {
      store.setFlightTarget(planetKey)
      store.setIsFlying(true)
    } else if (!store.spacecraftMode) {
      store.selectBody(planetKey)
    }
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

  useFrame((state, delta) => {
    if (!outerGroupRef.current || !spinGroupRef.current || !offsetGroupRef.current) return

    const { elapsedTime, timeSpeed, isPaused, sizeComparisonMode } = useStore.getState()

    if (sizeComparisonMode) {
      // Size comparison mode: lerp orbit rotation to 0, offset to lineup position
      outerGroupRef.current.rotation.y += (0 - outerGroupRef.current.rotation.y) * 0.05
      _compTarget.set(compPos.x, compPos.y, compPos.z)
      offsetGroupRef.current.position.lerp(_compTarget, 0.05)

      // Keep spinning slowly for visual interest
      spinGroupRef.current.rotation.y += rotSpeed * delta * 0.3

      // Hide moons in comparison mode
      if (moonsGroupRef.current) {
        moonsGroupRef.current.visible = false
      }
    } else {
      // Normal orbit mode
      // Orbital position -- absolute time, no drift
      outerGroupRef.current.rotation.y = orbSpeed * elapsedTime + initialAngle

      // Lerp offset position back to normal [distance, 0, 0]
      _compTarget.set(distance, 0, 0)
      offsetGroupRef.current.position.lerp(_compTarget, 0.05)

      // Self-rotation -- delta-based, scaled by timeSpeed
      if (!isPaused) {
        spinGroupRef.current.rotation.y += rotSpeed * delta * timeSpeed
      }

      // Moon visibility optimization -- check every 30 frames
      if (hasMoons && moonsGroupRef.current) {
        moonsGroupRef.current.visible = true // Re-enable first
        frameCounter.current++
        if (frameCounter.current % 30 === 0) {
          const camPos = state.camera.position
          const planetWorldPos = new THREE.Vector3()
          spinGroupRef.current.getWorldPosition(planetWorldPos)
          const distToCam = camPos.distanceTo(planetWorldPos)
          moonsGroupRef.current.visible = distToCam < distance * 0.6
        }
      }
    }

    // Smooth hover scale lerp (1.0 <-> 1.15)
    const targetScale = hovered ? 1.15 : 1
    hoverScale.current += (targetScale - hoverScale.current) * 0.1
    spinGroupRef.current.scale.setScalar(hoverScale.current)

    // Label visibility check (every 30 frames, reuse frameCounter)
    const { selectedBody } = useStore.getState()
    if (frameCounter.current % 30 === 0) {
      const camDist = state.camera.position.length()
      const shouldShowLabel = camDist > 80 && !selectedBody && !sizeComparisonMode
      setShowLabel(shouldShowLabel)
    }

    // Pulsing highlight ring when this planet is selected
    if (highlightRef.current) {
      const isSelected = selectedBody === planetKey
      highlightRef.current.visible = isSelected && !sizeComparisonMode
      if (isSelected) {
        const t = state.clock.getElapsedTime()
        highlightRef.current.material.opacity = 0.3 + 0.5 * (0.5 + 0.5 * Math.sin(t * 3))
      }
    }
  })

  // Build the fallback sphere (used as Suspense fallback and ErrorBoundary fallback)
  const fallbackSphere = <FallbackSphere radius={radius} color={color} segments={segments} />

  // Read comparison mode for conditional rendering
  const sizeComparisonMode = useStore((s) => s.sizeComparisonMode)

  return (
    <group ref={outerGroupRef}>
      <group ref={offsetGroupRef} position={[distance, 0, 0]}>
        <group rotation={[0, 0, tiltRad]}>

          {/* Spin group -- self-rotation applied here. Contains planet mesh + clouds. */}
          <group ref={spinGroupRef}>

            {/* Planet sphere: try texture, fall back to color */}
            <TextureErrorBoundary name={planetKey} fallback={fallbackSphere}>
              <Suspense fallback={fallbackSphere}>
                {planetInfo.texture ? (
                  <TexturedSphere radius={radius} texturePath={planetInfo.texture} segments={segments} />
                ) : (
                  fallbackSphere
                )}
              </Suspense>
            </TextureErrorBoundary>

            {/* Earth clouds */}
            {planetKey === 'earth' && (
              <CloudLayer
                radius={radius}
                cloudRadiusScale={planetInfo.cloudRadiusScale || 1.02}
                opacity={planetInfo.cloudOpacity || 0.4}
                color="white"
                rotSpeed={rotSpeed}
                cloudRotMult={planetInfo.cloudRotationMultiplier || 1.1}
                segments={segments}
              />
            )}

            {/* Venus clouds */}
            {planetKey === 'venus' && (
              <CloudLayer
                radius={radius}
                cloudRadiusScale={planetInfo.cloudRadiusScale || 1.03}
                opacity={planetInfo.cloudOpacity || 0.7}
                color="#F5F0D0"
                rotSpeed={rotSpeed}
                cloudRotMult={1}
                segments={segments}
              />
            )}
          </group>

          {/* Saturn rings -- outside spin group so they don't rotate with the planet */}
          {planetKey === 'saturn' && <SaturnRing />}

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

          {/* Click/hover directly on the visible sphere too */}
          <mesh
            visible={false}
            onClick={handleClick}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
          >
            <sphereGeometry args={[radius, 16, 16]} />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>

          {/* Moons -- inside tilt group, OUTSIDE spin group (don't rotate with planet) */}
          {hasMoons && (
            <group ref={moonsGroupRef}>
              {(moonsData[planetKey]).map((m) => (
                <Moon
                  key={m.key}
                  moonKey={m.key}
                  fallbackColor={m.fallbackColor || '#888888'}
                />
              ))}
            </group>
          )}

          {/* Size comparison label -- only in comparison mode */}
          {sizeComparisonMode && (
            <Html
              position={[0, -(radius + 1.5), 0]}
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
              <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
                {planetInfo.name || planetKey}
              </div>
              <div style={{ opacity: 0.7, fontSize: '10px' }}>
                {sizeLabel}
              </div>
            </Html>
          )}

          {/* Planet name label -- visible when camera is far, no selection, not comparing */}
          {showLabel && (
            <Html
              position={[0, radius + 0.8, 0]}
              center
              style={{
                color: 'white',
                fontSize: '10px',
                fontFamily: 'system-ui, sans-serif',
                opacity: 0.6,
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                userSelect: 'none',
                textShadow: '0 1px 4px rgba(0,0,0,0.9)',
              }}
            >
              {planetInfo.name || planetKey}
            </Html>
          )}

          {/* Selected planet highlight ring -- pulsing blue */}
          <mesh
            ref={highlightRef}
            visible={false}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <ringGeometry args={[radius * 1.3, radius * 1.5, 64]} />
            <meshBasicMaterial
              color="#4488FF"
              transparent
              opacity={0.5}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>

        </group>
      </group>
    </group>
  )
}

const Planet = memo(PlanetInner)
export default Planet
