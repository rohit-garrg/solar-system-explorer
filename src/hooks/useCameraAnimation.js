import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import useStore from '../stores/useStore'
import { getBodyWorldPosition } from '../utils/orbitMath'
import { RADII, MOONS, CAMERA, SIZE_COMPARISON_POSITIONS } from '../utils/scaleConfig'
import { spacecraftPositionRef } from '../components/Spacecraft'

const DEFAULT_POS = new THREE.Vector3(...CAMERA.defaultPosition)
const DEFAULT_TARGET = new THREE.Vector3(...CAMERA.defaultLookAt)
const LERP_FACTOR = 0.05
const FLIGHT_LERP = 0.05
const ARRIVAL_THRESHOLD = 0.1      // Close enough to stop animating
const RETURN_THRESHOLD = 0.5       // Looser threshold for returning to overview

// Size comparison camera preset
const SIZE_COMP_POS = new THREE.Vector3(0, 10, 60)
const SIZE_COMP_TARGET = new THREE.Vector3(0, 0, 0)

/**
 * Camera animation states:
 *   'idle'      - No lerping. OrbitControls enabled. User has full control.
 *   'animating' - Lerping to a selected body. OrbitControls disabled.
 *   'returning' - Lerping back to default overview. OrbitControls disabled.
 */

/**
 * Smoothly animates the camera to focus on the selected body,
 * follows the spacecraft during flight, supports size comparison mode,
 * or returns to the default overview when nothing is selected.
 *
 * Uses a 3-state machine so OrbitControls is only disabled during
 * active camera transitions — user zoom/rotate is never fought.
 */
export default function useCameraAnimation(controlsRef) {
  const { camera } = useThree()
  const animState = useRef('idle') // 'idle' | 'animating' | 'returning'
  const prevSelected = useRef(null)
  const prevSizeComp = useRef(false)

  // Detect selection changes to trigger state transitions
  useEffect(() => {
    const unsubBody = useStore.subscribe(
      (state) => state.selectedBody,
      (selected) => {
        if (selected !== prevSelected.current) {
          animState.current = selected ? 'animating' : 'returning'
          prevSelected.current = selected
        }
      },
    )

    const unsubSizeComp = useStore.subscribe(
      (state) => state.sizeComparisonMode,
      (sizeComp) => {
        if (sizeComp !== prevSizeComp.current) {
          animState.current = sizeComp ? 'animating' : 'returning'
          prevSizeComp.current = sizeComp
        }
      },
    )

    // Subscribe to resetView requests (Home button when no body selected)
    const unsubReset = useStore.subscribe(
      (state) => state.requestingReset,
      (requesting) => {
        if (requesting) {
          animState.current = 'returning'
          useStore.getState().clearResetRequest()
        }
      },
    )

    // Sync initial state
    const { selectedBody, sizeComparisonMode } = useStore.getState()
    prevSelected.current = selectedBody
    prevSizeComp.current = sizeComparisonMode
    if (selectedBody || sizeComparisonMode) {
      animState.current = 'animating'
    }

    return () => { unsubBody(); unsubSizeComp(); unsubReset() }
  }, [])

  useFrame(() => {
    const controls = controlsRef?.current
    if (!controls) return

    const { selectedBody, elapsedTime, isFlying, sizeComparisonMode } = useStore.getState()

    // Size comparison mode: animate to lineup overview, or zoom to a selected body
    if (sizeComparisonMode) {
      // A body is selected — zoom to it in the lineup
      if (selectedBody && SIZE_COMPARISON_POSITIONS[selectedBody]) {
        if (animState.current === 'idle') {
          // Already arrived, keep tracking
          controls.enabled = true
          const compPos = SIZE_COMPARISON_POSITIONS[selectedBody]
          controls.target.set(compPos.x, compPos.y, compPos.z)
          controls.update()
          return
        }
        controls.enabled = false
        const compPos = SIZE_COMPARISON_POSITIONS[selectedBody]
        const bodyRadius = RADII[selectedBody] || 0.5
        const focusDist = Math.max(bodyRadius * CAMERA.focusDistanceMultiplier, 3)
        const targetPos = new THREE.Vector3(
          compPos.x + focusDist * 0.3,
          compPos.y + focusDist * 0.5,
          compPos.z + focusDist * 0.6,
        )
        const targetLookAt = new THREE.Vector3(compPos.x, compPos.y, compPos.z)
        camera.position.lerp(targetPos, LERP_FACTOR)
        controls.target.lerp(targetLookAt, LERP_FACTOR)
        controls.update()
        if (camera.position.distanceTo(targetPos) < ARRIVAL_THRESHOLD) {
          animState.current = 'idle'
          controls.enabled = true
        }
      } else {
        // No selection — animate to lineup overview
        if (animState.current === 'idle') {
          controls.enabled = true
          return
        }
        controls.enabled = false
        camera.position.lerp(SIZE_COMP_POS, LERP_FACTOR)
        controls.target.lerp(SIZE_COMP_TARGET, LERP_FACTOR)
        controls.update()
        if (camera.position.distanceTo(SIZE_COMP_POS) < ARRIVAL_THRESHOLD) {
          animState.current = 'idle'
          controls.enabled = true
        }
      }
      return
    }

    // Spacecraft in flight: always track, don't go idle
    if (isFlying) {
      controls.enabled = false
      const scPos = spacecraftPositionRef.current
      // Camera offset: close behind and above the spacecraft
      const targetPos = new THREE.Vector3(
        scPos.x + 2,
        scPos.y + 3,
        scPos.z + 2,
      )
      const targetLookAt = new THREE.Vector3(scPos.x, scPos.y, scPos.z)

      camera.position.lerp(targetPos, FLIGHT_LERP)
      controls.target.lerp(targetLookAt, FLIGHT_LERP)
      controls.update()
      return
    }

    // State: idle — OrbitControls owns the camera, no lerping.
    // But if a body is selected, keep controls.target tracking its position
    // so the orbit pivot follows the planet as it moves.
    if (animState.current === 'idle') {
      controls.enabled = true
      if (selectedBody) {
        const pos = getBodyWorldPosition(selectedBody, elapsedTime)
        controls.target.set(pos[0], pos[1], pos[2])
        controls.update()
      }
      return
    }

    // State: animating — lerp to selected body
    if (animState.current === 'animating' && selectedBody) {
      controls.enabled = false
      const pos = getBodyWorldPosition(selectedBody, elapsedTime)

      // Defensive: if we get [0,0,0] for a non-sun body, the key is unknown — skip frame
      if (selectedBody !== 'sun' && pos[0] === 0 && pos[1] === 0 && pos[2] === 0) {
        return
      }

      const targetLookAt = new THREE.Vector3(pos[0], pos[1], pos[2])

      const bodyRadius = RADII[selectedBody] || (MOONS[selectedBody]?.radius) || 0.5
      const focusDist = Math.max(bodyRadius * CAMERA.focusDistanceMultiplier, 3)
      const targetPos = new THREE.Vector3(
        pos[0] + focusDist * 0.5,
        pos[1] + focusDist * 0.6,
        pos[2] + focusDist * 0.5,
      )

      camera.position.lerp(targetPos, LERP_FACTOR)
      controls.target.lerp(targetLookAt, LERP_FACTOR)
      controls.update()

      if (camera.position.distanceTo(targetPos) < ARRIVAL_THRESHOLD) {
        animState.current = 'idle'
        controls.enabled = true
      }
      return
    }

    // State: returning — lerp back to default overview
    if (animState.current === 'returning') {
      controls.enabled = false
      camera.position.lerp(DEFAULT_POS, LERP_FACTOR)
      controls.target.lerp(DEFAULT_TARGET, LERP_FACTOR)
      controls.update()

      if (camera.position.distanceTo(DEFAULT_POS) < RETURN_THRESHOLD) {
        animState.current = 'idle'
        controls.enabled = true
      }
      return
    }

    // Fallback: if animating but no selectedBody (race condition), return to default
    if (animState.current === 'animating' && !selectedBody) {
      animState.current = 'returning'
    }
  })

  return { animState }
}
