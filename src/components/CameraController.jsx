import { useRef } from 'react'
import { OrbitControls } from '@react-three/drei'
import { CAMERA } from '../utils/scaleConfig'
import useCameraAnimation from '../hooks/useCameraAnimation'

/**
 * Wraps OrbitControls with the project's zoom limits and damping settings.
 * Also runs the camera animation hook so selecting/deselecting a body
 * smoothly transitions the camera.
 *
 * enablePan is intentionally left true so users can pan when zoomed in.
 * dampingFactor: 0.05 gives a smooth, natural deceleration feel.
 */
export default function CameraController() {
  const controlsRef = useRef()

  // Hook drives camera lerp toward selected body (or back to default)
  useCameraAnimation(controlsRef)

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      minDistance={CAMERA.minDistance}
      maxDistance={CAMERA.maxDistance}
      enableDamping={true}
      dampingFactor={0.05}
    />
  )
}
