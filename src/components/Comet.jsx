import { useRef, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ellipticalOrbitPosition } from '../utils/orbitMath'
import { getHitRadius } from '../utils/scaleConfig'
import useStore from '../stores/useStore'

// Comet tail is hidden at 'low' quality to save draw calls

// Pre-allocate reusable objects outside useFrame to avoid GC pressure
const _cometPos = new THREE.Vector3()
const _tailDir = new THREE.Vector3()
const _up = new THREE.Vector3(0, 1, 0)
const _tailQuat = new THREE.Quaternion()
const _lookTarget = new THREE.Vector3()

/**
 * Comet -- follows an elliptical orbit with a cone tail pointing away from the Sun.
 *
 * Props:
 *   cometData  {object} -- from comets.json: key, name, semiMajorAxis, eccentricity,
 *                          inclination, speed, bodyRadius, color, maxTailLength
 *
 * The tail is a ConeGeometry that always points away from the Sun (origin).
 * Tail length scales inversely with distance to Sun (longer when closer).
 * Material uses AdditiveBlending for a glowing effect.
 */
export default function Comet({ cometData }) {
  const groupRef = useRef()
  const tailRef = useRef()
  const tailMeshRef = useRef()

  const {
    key,
    semiMajorAxis,
    eccentricity,
    inclination,
    speed,
    bodyRadius,
    color,
    maxTailLength,
  } = cometData

  // Hit area for tapping (bodyRadius is 0.15, well under 0.5)
  const hitRadius = getHitRadius(bodyRadius)

  // Hide tail at low quality
  const qualityLevel = useStore((s) => s.qualityLevel)
  const showTail = qualityLevel !== 'low'

  const handleClick = useCallback((e) => {
    e.stopPropagation()
    useStore.getState().selectBody(key)
  }, [key])

  const handlePointerOver = useCallback((e) => {
    e.stopPropagation()
    document.body.style.cursor = 'pointer'
  }, [])

  const handlePointerOut = useCallback(() => {
    document.body.style.cursor = 'auto'
  }, [])

  useFrame(() => {
    if (!groupRef.current) return

    const { elapsedTime } = useStore.getState()

    // Compute position along elliptical orbit
    const pos = ellipticalOrbitPosition(
      semiMajorAxis,
      eccentricity,
      speed,
      elapsedTime,
      inclination,
      0,
    )

    // Update comet group position
    groupRef.current.position.set(pos[0], pos[1], pos[2])

    // Tail direction: points away from Sun (Sun at origin)
    _cometPos.set(pos[0], pos[1], pos[2])
    const distToSun = _cometPos.length()

    if (distToSun > 0.01 && tailRef.current && tailMeshRef.current) {
      // Tail direction = normalized comet position (away from Sun)
      _tailDir.copy(_cometPos).normalize()

      // Tail length scales inversely with distance (longer when closer to Sun)
      const tailLength = Math.min(maxTailLength, Math.max(0.5, maxTailLength * 30 / distToSun))

      // Scale the tail cone (base height is 1, so scaleY = tailLength)
      tailRef.current.scale.set(0.3, tailLength, 0.3)

      // Position tail: offset from comet center, extending away from Sun
      // Cone is centered at origin with tip at +Y and base at -Y
      // We want the tip near the comet body and base extending away
      tailRef.current.position.copy(
        _tailDir.clone().multiplyScalar(bodyRadius + tailLength / 2)
      )

      // Orient the cone so +Y aligns with the tail direction (away from Sun)
      _lookTarget.copy(_cometPos).add(_tailDir)
      tailRef.current.lookAt(_lookTarget)
      // Rotate 90 degrees on X because ConeGeometry tip is along +Y but lookAt aligns Z
      tailRef.current.rotateX(Math.PI / 2)
    }
  })

  return (
    <group ref={groupRef}>
      {/* Comet body -- small icy sphere */}
      <mesh>
        <sphereGeometry args={[bodyRadius, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>

      {/* Comet tail -- cone pointing away from Sun (hidden at low quality) */}
      {showTail && (
        <group ref={tailRef}>
          <mesh ref={tailMeshRef}>
            <coneGeometry args={[0.5, 1, 8]} />
            <meshBasicMaterial
              color="#B0D8FF"
              transparent
              opacity={0.4}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      )}

      {/* Invisible expanded hit area for clicking */}
      <mesh
        visible={false}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <sphereGeometry args={[hitRadius, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </group>
  )
}
