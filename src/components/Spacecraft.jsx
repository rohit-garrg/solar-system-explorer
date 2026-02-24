import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import useStore from '../stores/useStore'
import { getBodyWorldPosition } from '../utils/orbitMath'
import { RADII, MOONS } from '../utils/scaleConfig'

// Flight duration in seconds
const FLIGHT_DURATION = 3.0
// Bezier control point Y offset (arcs above the orbital plane)
const ARC_HEIGHT = 20
// Duration of the arrival orientation transition (seconds)
const ORIENTATION_TRANSITION_DURATION = 0.5

// Pre-allocate reusable vectors outside useFrame
const _startPos = new THREE.Vector3()
const _endPos = new THREE.Vector3()
const _controlPos = new THREE.Vector3()
const _currentPos = new THREE.Vector3()
const _nextPos = new THREE.Vector3()
const _direction = new THREE.Vector3()
const _lookTarget = new THREE.Vector3()

// Pre-allocate quaternions for slerp transition
const _desiredQuat = new THREE.Quaternion()
const _tempQuat = new THREE.Quaternion()

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
 * Creates a triangular fin Shape for ExtrudeGeometry.
 */
function createFinShape() {
  const shape = new THREE.Shape()
  shape.moveTo(0, 0)
  shape.lineTo(0.08, -0.12)
  shape.lineTo(0, -0.08)
  shape.closePath()
  return shape
}

/**
 * Spacecraft -- a detailed kid-friendly rocket that flies between planets on a bezier path.
 * Only visible when spacecraftMode is true.
 */
export default function Spacecraft() {
  const groupRef = useRef()
  const innerFlameRef = useRef()
  const outerFlameRef = useRef()
  const flightStartTime = useRef(0)
  const flightStartPos = useRef(new THREE.Vector3())
  const flightEndPos = useRef(new THREE.Vector3())
  const flightControlPos = useRef(new THREE.Vector3())
  const wasFlying = useRef(false)

  // Orientation transition refs
  const transitionProgress = useRef(1) // 1 = complete, <1 = transitioning
  const lastFlightQuat = useRef(new THREE.Quaternion())

  // Nose cone: LatheGeometry with a smooth curved profile
  const noseGeo = useMemo(() => {
    const points = []
    const segments = 12
    for (let i = 0; i <= segments; i++) {
      const t = i / segments
      // Power curve for aerodynamic nose shape
      const radius = Math.pow(t, 0.6) * 0.1
      const y = (1 - t) * 0.18
      points.push(new THREE.Vector2(radius, y))
    }
    return new THREE.LatheGeometry(points, 16)
  }, [])

  // Triangular fin geometry
  const finGeo = useMemo(() => {
    const shape = createFinShape()
    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.015,
      bevelEnabled: false,
    })
  }, [])

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

  useFrame((_, delta) => {
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

    // Flame animation (runs in both flight and idle)
    const time = performance.now() * 0.001
    const flicker1 = Math.sin(time * 12) * 0.15 + 1
    const flicker2 = Math.sin(time * 17 + 2.3) * 0.1 + 1
    const flameScale = flicker1 * flicker2
    const isInFlight = isFlying && flightTarget
    const thrustMultiplier = isInFlight ? 1.8 : 1.0

    if (innerFlameRef.current) {
      const s = flameScale * thrustMultiplier
      innerFlameRef.current.scale.set(s, s * 1.1, s)
      innerFlameRef.current.material.opacity = 0.7 + Math.sin(time * 15) * 0.2
    }
    if (outerFlameRef.current) {
      const s = flameScale * thrustMultiplier * 1.1
      outerFlameRef.current.scale.set(s, s * 1.05, s)
      outerFlameRef.current.material.opacity = 0.4 + Math.sin(time * 11 + 1) * 0.15
    }

    if (isInFlight) {
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
        // Capture flight-end orientation for smooth transition
        lastFlightQuat.current.copy(groupRef.current.quaternion)
        transitionProgress.current = 0

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

      // Compute desired idle orientation: nose pointing AWAY from the planet
      _lookTarget.set(bodyArr[0], bodyArr[1], bodyArr[2])
      groupRef.current.lookAt(_lookTarget)
      groupRef.current.rotateX(-Math.PI / 2)

      // Smooth slerp transition from flight-end orientation
      if (transitionProgress.current < 1) {
        transitionProgress.current = Math.min(
          transitionProgress.current + delta / ORIENTATION_TRANSITION_DURATION,
          1,
        )
        // Smoothstep the transition progress
        const p = transitionProgress.current
        const smoothP = p * p * (3 - 2 * p)

        // Save the desired idle quaternion
        _desiredQuat.copy(groupRef.current.quaternion)

        // Slerp from flight-end to desired idle
        _tempQuat.copy(lastFlightQuat.current)
        _tempQuat.slerp(_desiredQuat, smoothP)
        groupRef.current.quaternion.copy(_tempQuat)
      }
    } else {
      // No body selected: park near the Sun
      _currentPos.set(12, 5, 0)
      groupRef.current.position.lerp(_currentPos, 0.05)
      spacecraftPositionRef.current.copy(groupRef.current.position)
    }
  })

  return (
    <group ref={groupRef} visible={false} scale={[3, 3, 3]}>
      {/* Nose cone (red, curved LatheGeometry) */}
      <mesh geometry={noseGeo} position={[0, 0.28, 0]}>
        <meshBasicMaterial color="#E63946" />
      </mesh>

      {/* Upper body (white, slight taper) */}
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.095, 0.1, 0.22, 16]} />
        <meshBasicMaterial color="#F1FAEE" />
      </mesh>

      {/* Stripe band (blue accent ring) */}
      <mesh position={[0, 0.10, 0]}>
        <cylinderGeometry args={[0.101, 0.101, 0.025, 16]} />
        <meshBasicMaterial color="#457B9D" />
      </mesh>

      {/* Porthole rim (light blue torus) */}
      <mesh position={[0, 0.18, 0.096]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.028, 0.006, 8, 16]} />
        <meshBasicMaterial color="#A8DADC" />
      </mesh>

      {/* Porthole glass (dark blue circle) */}
      <mesh position={[0, 0.18, 0.098]}>
        <circleGeometry args={[0.025, 16]} />
        <meshBasicMaterial color="#1D3557" />
      </mesh>

      {/* Lower body / skirt (white, flared) */}
      <mesh position={[0, -0.05, 0]}>
        <cylinderGeometry args={[0.1, 0.12, 0.18, 16]} />
        <meshBasicMaterial color="#F1FAEE" />
      </mesh>

      {/* 3 Triangular fins (dark blue, ExtrudeGeometry) */}
      {[0, (2 * Math.PI) / 3, (4 * Math.PI) / 3].map((angle, i) => (
        <mesh
          key={i}
          geometry={finGeo}
          position={[
            Math.sin(angle) * 0.115,
            -0.08,
            Math.cos(angle) * 0.115,
          ]}
          rotation={[0, -angle, 0]}
        >
          <meshBasicMaterial color="#1D3557" />
        </mesh>
      ))}

      {/* Engine nozzle (gray truncated cone) */}
      <mesh position={[0, -0.15, 0]}>
        <cylinderGeometry args={[0.06, 0.04, 0.06, 12]} />
        <meshBasicMaterial color="#555555" />
      </mesh>

      {/* Inner flame (yellow, additive) */}
      <mesh ref={innerFlameRef} position={[0, -0.22, 0]}>
        <coneGeometry args={[0.035, 0.1, 8]} />
        <meshBasicMaterial
          color="#FFBE0B"
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Outer flame (orange, additive) */}
      <mesh ref={outerFlameRef} position={[0, -0.24, 0]}>
        <coneGeometry args={[0.05, 0.14, 8]} />
        <meshBasicMaterial
          color="#FF6B35"
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}
