import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import useStore from '../stores/useStore'
import { getBodyWorldPosition } from '../utils/orbitMath'
import { RADII, MOONS } from '../utils/scaleConfig'

// Flight duration in seconds
const FLIGHT_DURATION = 3.0
// Bezier control point Y offset (arcs above the orbital plane)
const ARC_HEIGHT = 20

// Pre-allocate reusable vectors outside useFrame
const _startPos = new THREE.Vector3()
const _endPos = new THREE.Vector3()
const _controlPos = new THREE.Vector3()
const _currentPos = new THREE.Vector3()
const _nextPos = new THREE.Vector3()
const _direction = new THREE.Vector3()
const _lookTarget = new THREE.Vector3()

/**
 * Exported ref so the camera can read the spacecraft's position.
 * Must be a module-level ref so CameraController can import it.
 */
export const spacecraftPositionRef = { current: new THREE.Vector3() }

/**
 * Quadratic Bezier interpolation.
 * B(t) = (1-t)^2 * p0 + 2(1-t)*t * p1 + t^2 * p2
 */
function quadBezier(out, p0, p1, p2, t) {
  const t1 = 1 - t
  out.x = t1 * t1 * p0.x + 2 * t1 * t * p1.x + t * t * p2.x
  out.y = t1 * t1 * p0.y + 2 * t1 * t * p1.y + t * t * p2.y
  out.z = t1 * t1 * p0.z + 2 * t1 * t * p1.z + t * t * p2.z
  return out
}

/**
 * Spacecraft -- a small rocket mesh that flies between planets on a bezier path.
 * Only visible when spacecraftMode is true.
 *
 * Flight mechanics:
 * - When spacecraftMode && click target: set flightTarget + isFlying
 * - Computes quadratic bezier: start -> control (midpoint + ARC_HEIGHT Y) -> target
 * - Duration: 3 seconds
 * - On arrival: selectBody(target), markVisited(target)
 * - Idle: follows selectedBody with slight offset
 */
export default function Spacecraft() {
  const groupRef = useRef()
  const flightStartTime = useRef(0)
  const flightStartPos = useRef(new THREE.Vector3())
  const flightEndPos = useRef(new THREE.Vector3())
  const flightControlPos = useRef(new THREE.Vector3())
  const wasFlying = useRef(false)

  // Listen for flight start
  useEffect(() => {
    const unsub = useStore.subscribe(
      (s) => s.isFlying,
      (isFlying) => {
        if (isFlying && !wasFlying.current) {
          const { flightTarget, selectedBody, elapsedTime } = useStore.getState()
          if (!flightTarget) return

          // Compute start and end positions at the moment flight begins
          const startKey = selectedBody || 'sun'
          const startArr = getBodyWorldPosition(startKey, elapsedTime)
          flightStartPos.current.set(startArr[0], startArr[1], startArr[2])

          const endArr = getBodyWorldPosition(flightTarget, elapsedTime)
          flightEndPos.current.set(endArr[0], endArr[1], endArr[2])

          // Control point: midpoint + arc height above the orbital plane
          flightControlPos.current.lerpVectors(
            flightStartPos.current,
            flightEndPos.current,
            0.5,
          )
          flightControlPos.current.y += ARC_HEIGHT

          flightStartTime.current = elapsedTime
        }
        wasFlying.current = isFlying
      },
    )
    return unsub
  }, [])

  useFrame(() => {
    if (!groupRef.current) return

    const {
      spacecraftMode,
      isFlying,
      flightTarget,
      selectedBody,
      elapsedTime,
    } = useStore.getState()

    // Hide entirely when spacecraft mode is off
    groupRef.current.visible = spacecraftMode

    if (!spacecraftMode) return

    if (isFlying && flightTarget) {
      // In-flight: bezier interpolation
      const elapsed = elapsedTime - flightStartTime.current
      const t = Math.min(elapsed / FLIGHT_DURATION, 1)

      // Ease-in-out using smoothstep
      const smoothT = t * t * (3 - 2 * t)

      // Update end position to track moving target
      const targetArr = getBodyWorldPosition(flightTarget, elapsedTime)
      flightEndPos.current.set(targetArr[0], targetArr[1], targetArr[2])

      // Recompute control point (keeps arc consistent as target moves)
      flightControlPos.current.lerpVectors(
        flightStartPos.current,
        flightEndPos.current,
        0.5,
      )
      flightControlPos.current.y += ARC_HEIGHT * (1 - smoothT) // Arc flattens as we approach

      quadBezier(
        _currentPos,
        flightStartPos.current,
        flightControlPos.current,
        flightEndPos.current,
        smoothT,
      )

      groupRef.current.position.copy(_currentPos)
      spacecraftPositionRef.current.copy(_currentPos)

      // Orient rocket along flight direction (look at next position)
      const nextT = Math.min(smoothT + 0.02, 1)
      quadBezier(
        _nextPos,
        flightStartPos.current,
        flightControlPos.current,
        flightEndPos.current,
        nextT,
      )
      _direction.subVectors(_nextPos, _currentPos)
      if (_direction.lengthSq() > 0.0001) {
        _lookTarget.addVectors(_currentPos, _direction)
        groupRef.current.lookAt(_lookTarget)
        // Rocket tip is +Y, but lookAt aligns -Z. Rotate so nose points forward.
        groupRef.current.rotateX(Math.PI / 2)
      }

      // Check if arrived
      if (t >= 1) {
        const store = useStore.getState()
        store.setIsFlying(false)
        store.selectBody(flightTarget)
        store.markVisited(flightTarget)
        store.setFlightTarget(null)
      }
    } else if (selectedBody) {
      // Idle: hover near the selected body with a small offset
      const bodyArr = getBodyWorldPosition(selectedBody, elapsedTime)
      const bodyRadius = RADII[selectedBody] || (MOONS[selectedBody]?.radius) || 0.5
      const offset = bodyRadius * 2 + 1

      _currentPos.set(
        bodyArr[0] + offset * 0.5,
        bodyArr[1] + offset * 0.4,
        bodyArr[2] + offset * 0.3,
      )
      groupRef.current.position.lerp(_currentPos, 0.05)
      spacecraftPositionRef.current.copy(groupRef.current.position)

      // Face the selected body
      _lookTarget.set(bodyArr[0], bodyArr[1], bodyArr[2])
      groupRef.current.lookAt(_lookTarget)
      groupRef.current.rotateX(Math.PI / 2)
    } else {
      // No body selected: park near the Sun
      _currentPos.set(12, 5, 0)
      groupRef.current.position.lerp(_currentPos, 0.05)
      spacecraftPositionRef.current.copy(groupRef.current.position)
    }
  })

  return (
    <group ref={groupRef} visible={false}>
      {/* Rocket nose cone (red) */}
      <mesh position={[0, 0.35, 0]}>
        <coneGeometry args={[0.1, 0.2, 8]} />
        <meshBasicMaterial color="#CC3333" />
      </mesh>

      {/* Rocket body (white) */}
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.3, 8]} />
        <meshBasicMaterial color="#EEEEEE" />
      </mesh>

      {/* Rocket fins (gray), 3 fins around body */}
      {[0, (2 * Math.PI) / 3, (4 * Math.PI) / 3].map((angle, i) => (
        <mesh
          key={i}
          position={[
            Math.sin(angle) * 0.12,
            -0.05,
            Math.cos(angle) * 0.12,
          ]}
          rotation={[0, angle, 0]}
        >
          <boxGeometry args={[0.02, 0.15, 0.08]} />
          <meshBasicMaterial color="#444444" />
        </mesh>
      ))}

      {/* Engine glow (small sphere at base) */}
      <mesh position={[0, -0.1, 0]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshBasicMaterial
          color="#FF6600"
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  )
}
