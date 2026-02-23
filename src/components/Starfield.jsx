import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Points, PointMaterial, Line, Html } from '@react-three/drei'
import * as THREE from 'three'
import constellationsData from '../data/constellations.json'

const DIM_STAR_COUNT = 1800
const BRIGHT_STAR_COUNT = 200
const SPHERE_RADIUS = 490

/**
 * Generate random star positions on a sphere.
 * Returns Float32Array of xyz positions.
 */
function generateStarPositions(count, radiusBase) {
  const arr = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * 2 * Math.PI
    const phi = Math.acos(2 * Math.random() - 1)
    const r = radiusBase * (0.85 + Math.random() * 0.15)

    arr[i * 3]     = r * Math.sin(phi) * Math.cos(theta)
    arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
    arr[i * 3 + 2] = r * Math.cos(phi)
  }
  return arr
}

/**
 * DimStars -- 1800 small, steady background stars.
 */
function DimStars() {
  const positions = useMemo(() => generateStarPositions(DIM_STAR_COUNT, SPHERE_RADIUS), [])

  return (
    <Points positions={positions} frustumCulled={false}>
      <PointMaterial
        color="white"
        size={0.3}
        sizeAttenuation={false}
        transparent
        opacity={0.7}
        depthWrite={false}
      />
    </Points>
  )
}

/**
 * BrightStars -- 200 larger stars that twinkle.
 * Twinkling is done by modulating the color buffer in useFrame.
 */
function BrightStars() {
  const pointsRef = useRef()

  const { positions, phases, frequencies, baseColors } = useMemo(() => {
    const pos = generateStarPositions(BRIGHT_STAR_COUNT, SPHERE_RADIUS * 0.98)
    const ph = new Float32Array(BRIGHT_STAR_COUNT)
    const freq = new Float32Array(BRIGHT_STAR_COUNT)
    const colors = new Float32Array(BRIGHT_STAR_COUNT * 3)

    for (let i = 0; i < BRIGHT_STAR_COUNT; i++) {
      ph[i] = Math.random() * Math.PI * 2
      freq[i] = 0.5 + Math.random() * 2.0 // Twinkle speed variety

      // Most stars white, a few colored
      const roll = Math.random()
      if (roll < 0.05) {
        // Blue-white (like Sirius)
        colors[i * 3]     = 0.75
        colors[i * 3 + 1] = 0.85
        colors[i * 3 + 2] = 1.0
      } else if (roll < 0.1) {
        // Reddish (like Betelgeuse)
        colors[i * 3]     = 1.0
        colors[i * 3 + 1] = 0.6
        colors[i * 3 + 2] = 0.4
      } else if (roll < 0.13) {
        // Yellow-white (like Polaris)
        colors[i * 3]     = 1.0
        colors[i * 3 + 1] = 0.95
        colors[i * 3 + 2] = 0.8
      } else {
        // White
        colors[i * 3]     = 1.0
        colors[i * 3 + 1] = 1.0
        colors[i * 3 + 2] = 1.0
      }
    }

    return { positions: pos, phases: ph, frequencies: freq, baseColors: colors }
  }, [])

  // Animate color brightness for twinkle effect
  useFrame(({ clock }) => {
    if (!pointsRef.current) return
    const geom = pointsRef.current.geometry
    if (!geom.attributes.color) return

    const colorArr = geom.attributes.color.array
    const t = clock.getElapsedTime()

    for (let i = 0; i < BRIGHT_STAR_COUNT; i++) {
      // Oscillate brightness between 0.4 and 1.0
      const brightness = 0.6 + 0.4 * Math.sin(t * frequencies[i] + phases[i])
      colorArr[i * 3]     = baseColors[i * 3] * brightness
      colorArr[i * 3 + 1] = baseColors[i * 3 + 1] * brightness
      colorArr[i * 3 + 2] = baseColors[i * 3 + 2] * brightness
    }

    geom.attributes.color.needsUpdate = true
  })

  // Build initial color buffer
  const colors = useMemo(() => new Float32Array(baseColors), [baseColors])

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={BRIGHT_STAR_COUNT}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={BRIGHT_STAR_COUNT}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        vertexColors
        size={1.0}
        sizeAttenuation={false}
        transparent
        opacity={0.95}
        depthWrite={false}
      />
    </points>
  )
}

/**
 * Constellation lines and labels.
 * Only visible when camera is far enough from origin (> 100 units).
 */
function Constellations() {
  const groupRef = useRef()
  const { camera } = useThree()

  // Precompute line points for each constellation
  const constellationLines = useMemo(() => {
    return constellationsData.map((c) => {
      const segments = c.lines.map(([a, b]) => {
        const sa = c.stars[a]
        const sb = c.stars[b]
        return [
          new THREE.Vector3(sa.x, sa.y, sa.z),
          new THREE.Vector3(sb.x, sb.y, sb.z),
        ]
      })
      // Centroid for label placement
      const cx = c.stars.reduce((s, p) => s + p.x, 0) / c.stars.length
      const cy = c.stars.reduce((s, p) => s + p.y, 0) / c.stars.length
      const cz = c.stars.reduce((s, p) => s + p.z, 0) / c.stars.length

      return { name: c.name, segments, centroid: [cx, cy, cz] }
    })
  }, [])

  // Show/hide based on camera distance from origin
  useFrame(() => {
    if (!groupRef.current) return
    const dist = camera.position.length()
    groupRef.current.visible = dist > 100
  })

  return (
    <group ref={groupRef} visible={false}>
      {constellationLines.map((c) => (
        <group key={c.name}>
          {/* Line segments */}
          {c.segments.map((seg, i) => (
            <Line
              key={i}
              points={seg}
              color="white"
              transparent
              opacity={0.08}
              lineWidth={1}
            />
          ))}

          {/* Label at centroid */}
          <Html
            position={c.centroid}
            center
            style={{
              color: 'rgba(255,255,255,0.25)',
              fontSize: '10px',
              fontFamily: 'system-ui, sans-serif',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          >
            {c.name}
          </Html>
        </group>
      ))}
    </group>
  )
}

/**
 * Background starfield -- dim stars + bright twinkling stars + constellations.
 *
 * Stars are on a large sphere (r=490). Constellations overlay at the same distance
 * with very faint lines and labels, visible only when zoomed out.
 */
export default function Starfield() {
  return (
    <group>
      <DimStars />
      <BrightStars />
      <Constellations />
    </group>
  )
}
