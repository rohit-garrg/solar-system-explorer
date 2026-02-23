import { useRef, useState, useCallback, useMemo, Suspense, Component } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import {
  RADII,
  DISTANCES,
  ORBITAL_SPEEDS,
  ROTATION_SPEEDS,
  AXIAL_TILTS,
  FALLBACK_COLORS,
  SATURN_RING,
  getHitRadius,
} from '../utils/scaleConfig'
import { degToRad } from '../utils/orbitMath'
import useStore from '../stores/useStore'
import planetsData from '../data/planets.json'

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
function CloudLayer({ radius, cloudRadiusScale, opacity, color, rotSpeed, cloudRotMult = 1 }) {
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
      <sphereGeometry args={[cloudRadius, 64, 64]} />
      <meshStandardMaterial
        color={color}
        transparent
        opacity={opacity}
        depthWrite={false}
      />
    </mesh>
  )
}

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
 * Orbital animation: absolute time (orbSpeed * elapsedTime + initialAngle).
 * Self-rotation: delta-based, scaled by timeSpeed.
 */
export default function Planet({ planetKey, initialAngle = 0 }) {
  const outerGroupRef = useRef()
  const spinGroupRef = useRef()

  const [hovered, setHovered] = useState(false)
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
    if (!outerGroupRef.current || !spinGroupRef.current) return

    const { elapsedTime, timeSpeed, isPaused } = useStore.getState()

    // Orbital position -- absolute time, no drift
    outerGroupRef.current.rotation.y = orbSpeed * elapsedTime + initialAngle

    // Self-rotation -- delta-based, scaled by timeSpeed
    if (!isPaused) {
      spinGroupRef.current.rotation.y += rotSpeed * delta * timeSpeed
    }

    // Smooth hover scale lerp (1.0 <-> 1.15)
    const targetScale = hovered ? 1.15 : 1
    hoverScale.current += (targetScale - hoverScale.current) * 0.1
    spinGroupRef.current.scale.setScalar(hoverScale.current)
  })

  // Build the fallback sphere (used as Suspense fallback and ErrorBoundary fallback)
  const fallbackSphere = <FallbackSphere radius={radius} color={color} />

  return (
    <group ref={outerGroupRef}>
      <group position={[distance, 0, 0]}>
        <group rotation={[0, 0, tiltRad]}>

          {/* Spin group -- self-rotation applied here. Contains planet mesh + clouds. */}
          <group ref={spinGroupRef}>

            {/* Planet sphere: try texture, fall back to color */}
            <TextureErrorBoundary name={planetKey} fallback={fallbackSphere}>
              <Suspense fallback={fallbackSphere}>
                {planetInfo.texture ? (
                  <TexturedSphere radius={radius} texturePath={planetInfo.texture} />
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

          {/* Moons will be rendered here in Step 8 (inside tilt group, outside spin group) */}

        </group>
      </group>
    </group>
  )
}
