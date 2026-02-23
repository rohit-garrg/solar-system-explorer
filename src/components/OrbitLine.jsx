import { useMemo, memo } from 'react'
import * as THREE from 'three'

const SEGMENTS = 128  // Number of points in the circle

/**
 * Faint circular line showing a planet's orbital path around the Sun.
 *
 * Built with a BufferGeometry + LineLoop for performance — a single draw call
 * for the entire circle. Opacity 0.15 so it's a subtle guide, not distracting.
 *
 * Uses LineLoop (not LineSegments) so the circle closes properly.
 *
 * Props:
 *   distance {number} — orbital radius in scene units (matches DISTANCES[key])
 */
function OrbitLineInner({ distance }) {
  // Build the circle geometry once — useMemo prevents recreation on re-renders
  const geometry = useMemo(() => {
    const points = []
    for (let i = 0; i <= SEGMENTS; i++) {
      const angle = (i / SEGMENTS) * Math.PI * 2
      points.push(
        new THREE.Vector3(
          distance * Math.cos(angle),
          0,                              // flat in XZ plane (y=0)
          distance * Math.sin(angle),
        )
      )
    }
    // BufferGeometry from points array
    const geo = new THREE.BufferGeometry().setFromPoints(points)
    return geo
  }, [distance])

  return (
    <lineLoop geometry={geometry}>
      <lineBasicMaterial
        color="white"
        transparent
        opacity={0.15}
        depthWrite={false}   // Don't occlude objects behind the line
      />
    </lineLoop>
  )
}

const OrbitLine = memo(OrbitLineInner)
export default OrbitLine
