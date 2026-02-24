import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ASTEROID_BELT } from '../utils/scaleConfig'
import useStore from '../stores/useStore'

// Pre-allocate a dummy Object3D for setting instance matrices
const dummy = new THREE.Object3D()

/**
 * Asteroid belt -- InstancedMesh torus of small rocks between Mars and Jupiter.
 *
 * Renders 500 small IcosahedronGeometry rocks (200 in low quality) in a torus
 * from radius 38 to 46, with random Y offset -1.5 to +1.5.
 * Each asteroid has a random gray-brown color.
 * The entire belt rotates slowly (0.002 rad/s) using absolute time.
 */
export default function AsteroidBelt() {
  const meshRef = useRef()

  // Adapt count based on quality level: high=500, medium=200, low=100
  const qualityLevel = useStore((s) => s.qualityLevel)
  const count = qualityLevel === 'low' ? 100 : qualityLevel === 'medium' ? ASTEROID_BELT.lowCount : ASTEROID_BELT.count

  // Create the shared geometry once
  const geometry = useMemo(() => new THREE.IcosahedronGeometry(1, 0), [])

  // Generate random asteroid data (positions, scales, colors) once per count change
  const asteroidData = useMemo(() => {
    const positions = []
    const scales = []
    const colors = []

    for (let i = 0; i < count; i++) {
      // Random angle around the belt
      const angle = Math.random() * Math.PI * 2
      // Random radius within the torus band
      const radius = ASTEROID_BELT.innerRadius + Math.random() * (ASTEROID_BELT.outerRadius - ASTEROID_BELT.innerRadius)
      // Random Y offset
      const y = (Math.random() * 2 - 1) * ASTEROID_BELT.ySpread

      positions.push({
        x: radius * Math.cos(angle),
        y,
        z: radius * Math.sin(angle),
      })

      // Random scale between minSize and maxSize
      const scale = ASTEROID_BELT.minSize + Math.random() * (ASTEROID_BELT.maxSize - ASTEROID_BELT.minSize)
      scales.push(scale)

      // Brighter gray-brown color (R:0.45-0.70, G:0.40-0.60, B:0.30-0.45)
      colors.push(
        0.45 + Math.random() * 0.25,
        0.40 + Math.random() * 0.20,
        0.30 + Math.random() * 0.15,
      )
    }

    return { positions, scales, colors }
  }, [count])

  // Populate instance matrices and colors on mount / when data changes
  useEffect(() => {
    if (!meshRef.current) return

    const mesh = meshRef.current

    for (let i = 0; i < count; i++) {
      const pos = asteroidData.positions[i]
      dummy.position.set(pos.x, pos.y, pos.z)

      // Random rotation for visual variety
      dummy.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
      )

      dummy.scale.setScalar(asteroidData.scales[i])
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }

    mesh.instanceMatrix.needsUpdate = true

    // Set per-instance colors
    const colorAttr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      colorAttr[i * 3] = asteroidData.colors[i * 3]
      colorAttr[i * 3 + 1] = asteroidData.colors[i * 3 + 1]
      colorAttr[i * 3 + 2] = asteroidData.colors[i * 3 + 2]
    }
    mesh.instanceColor = new THREE.InstancedBufferAttribute(colorAttr, 3)
  }, [count, asteroidData])

  // Rotate the entire belt slowly using absolute time
  useFrame(() => {
    if (!meshRef.current) return
    const { elapsedTime } = useStore.getState()
    meshRef.current.rotation.y = ASTEROID_BELT.rotationSpeed * elapsedTime
  })

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, undefined, count]}
      frustumCulled={false}
    >
      <meshBasicMaterial vertexColors />
    </instancedMesh>
  )
}
