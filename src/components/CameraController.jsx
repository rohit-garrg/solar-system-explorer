import { OrbitControls } from '@react-three/drei'
import { CAMERA } from '../utils/scaleConfig'

/**
 * Wraps OrbitControls with the project's zoom limits and damping settings.
 * Future: add lerp-based auto-focus animation (useCameraAnimation hook).
 *
 * enablePan is intentionally left true so users can pan when zoomed in.
 * dampingFactor: 0.05 gives a smooth, natural deceleration feel.
 */
export default function CameraController() {
  return (
    <OrbitControls
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
