import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import useStore from '../stores/useStore'
import { getBodyWorldPosition } from '../utils/orbitMath'
import { RADII, MOONS, CAMERA } from '../utils/scaleConfig'
import { spacecraftPositionRef } from '../components/Spacecraft'

const DEFAULT_POS = new THREE.Vector3(...CAMERA.defaultPosition)
const DEFAULT_TARGET = new THREE.Vector3(...CAMERA.defaultLookAt)
const LERP_FACTOR = 0.05
const FLIGHT_LERP = 0.03  // Slower lerp during flight for cinematic feel

// Size comparison camera preset
const SIZE_COMP_POS = new THREE.Vector3(0, 10, 50)
const SIZE_COMP_TARGET = new THREE.Vector3(0, 0, 0)

/**
 * Smoothly animates the camera to focus on the selected body,
 * follows the spacecraft during flight, supports size comparison mode,
 * or returns to the default overview when nothing is selected.
 *
 * Receives a ref to OrbitControls so it can update the lookAt target.
 */
export default function useCameraAnimation(controlsRef) {
  const { camera } = useThree()
  const isAnimating = useRef(false)
  const prevSelected = useRef(null)

  // Detect selection change -- reset animation flag
  useEffect(() => {
    const unsub = useStore.subscribe(
      (state) => state.selectedBody,
      (selected) => {
        if (selected !== prevSelected.current) {
          isAnimating.current = true
          prevSelected.current = selected
        }
      },
    )
    const current = useStore.getState().selectedBody
    if (current !== prevSelected.current) {
      isAnimating.current = true
      prevSelected.current = current
    }
    return unsub
  }, [])

  useFrame(() => {
    const controls = controlsRef?.current
    if (!controls) return

    const { selectedBody, elapsedTime, isFlying, sizeComparisonMode } = useStore.getState()

    // Size comparison mode: camera to side view
    if (sizeComparisonMode) {
      camera.position.lerp(SIZE_COMP_POS, LERP_FACTOR)
      controls.target.lerp(SIZE_COMP_TARGET, LERP_FACTOR)
      controls.update()
      return
    }

    // Spacecraft in flight: follow the spacecraft in third-person
    if (isFlying) {
      const scPos = spacecraftPositionRef.current
      // Camera offset: above and behind the spacecraft
      const targetPos = new THREE.Vector3(
        scPos.x + 5,
        scPos.y + 8,
        scPos.z + 5,
      )
      const targetLookAt = new THREE.Vector3(scPos.x, scPos.y, scPos.z)

      camera.position.lerp(targetPos, FLIGHT_LERP)
      controls.target.lerp(targetLookAt, FLIGHT_LERP)
      controls.update()
      return
    }

    if (selectedBody) {
      // Compute the body's current world position
      const pos = getBodyWorldPosition(selectedBody, elapsedTime)
      const targetLookAt = new THREE.Vector3(pos[0], pos[1], pos[2])

      // Camera offset: position relative to body (above and behind)
      const bodyRadius = RADII[selectedBody] || (MOONS[selectedBody]?.radius) || 0.5
      const focusDist = Math.max(bodyRadius * CAMERA.focusDistanceMultiplier, 3)
      const targetPos = new THREE.Vector3(
        pos[0] + focusDist * 0.5,
        pos[1] + focusDist * 0.6,
        pos[2] + focusDist * 0.5,
      )

      // Lerp camera position
      camera.position.lerp(targetPos, LERP_FACTOR)
      // Lerp OrbitControls target (lookAt)
      controls.target.lerp(targetLookAt, LERP_FACTOR)
      controls.update()

      // Check if close enough to stop animating
      if (camera.position.distanceTo(targetPos) < 0.1) {
        isAnimating.current = false
      }
    } else {
      // Lerp back to default overview
      camera.position.lerp(DEFAULT_POS, LERP_FACTOR)
      controls.target.lerp(DEFAULT_TARGET, LERP_FACTOR)
      controls.update()

      if (camera.position.distanceTo(DEFAULT_POS) < 0.5) {
        isAnimating.current = false
      }
    }
  })

  return { isAnimating }
}
