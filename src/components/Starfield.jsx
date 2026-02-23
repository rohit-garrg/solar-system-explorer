import { useMemo } from 'react'
import { Points, PointMaterial } from '@react-three/drei'

const STAR_COUNT = 2000
const SPHERE_RADIUS = 500

/**
 * Background star field — 2000 random points distributed on a large sphere.
 *
 * Uses drei's <Points> + <PointMaterial> which is optimized for large
 * point clouds (single draw call).
 *
 * sizeAttenuation={false} keeps stars the same pixel size regardless of
 * camera distance — they're meant to look infinitely far away.
 */
export default function Starfield() {
  // Generate random star positions on a sphere. useMemo so it only runs once.
  const positions = useMemo(() => {
    const arr = new Float32Array(STAR_COUNT * 3)
    for (let i = 0; i < STAR_COUNT; i++) {
      // Spherical coordinates: uniform distribution on sphere surface
      const theta = Math.random() * 2 * Math.PI          // azimuth 0–2π
      const phi = Math.acos(2 * Math.random() - 1)        // polar 0–π (uniform)
      const r = SPHERE_RADIUS * (0.8 + Math.random() * 0.2) // vary radius slightly

      arr[i * 3]     = r * Math.sin(phi) * Math.cos(theta) // x
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) // y
      arr[i * 3 + 2] = r * Math.cos(phi)                   // z
    }
    return arr
  }, [])

  return (
    <Points positions={positions} frustumCulled={false}>
      <PointMaterial
        color="white"
        size={0.5}
        sizeAttenuation={false}
        transparent
        opacity={0.9}
        depthWrite={false}
      />
    </Points>
  )
}
