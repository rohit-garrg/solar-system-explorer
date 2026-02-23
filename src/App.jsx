import { Canvas } from '@react-three/fiber'
import ErrorBoundary from './components/ErrorBoundary'
import SolarSystem from './components/SolarSystem'
import CameraController from './components/CameraController'
import FactCard from './components/ui/FactCard'
import BackButton from './components/ui/BackButton'
import TimeSlider from './components/ui/TimeSlider'
import { CAMERA } from './utils/scaleConfig'

/**
 * Root component -- Canvas filling the full viewport, with ErrorBoundary wrapping
 * everything. UI overlays (FactCard, BackButton, etc.) are HTML siblings of the
 * Canvas, layered via absolute positioning.
 *
 * preserveDrawingBuffer is required for the postcard screenshot feature.
 * alpha: false gives a solid black background (faster than transparent canvas).
 */
export default function App() {
  return (
    <ErrorBoundary>
      {/* Full-screen container */}
      <div style={{ width: '100vw', height: '100vh', position: 'relative', background: '#000' }}>

        {/* 3D Canvas */}
        <Canvas
          gl={{ preserveDrawingBuffer: true, antialias: true, alpha: false }}
          camera={{
            position: CAMERA.defaultPosition,
            fov: 45,
            near: CAMERA.near,
            far: CAMERA.far,
          }}
          onCreated={({ gl }) => {
            // Handle WebGL context loss gracefully
            const canvas = gl.domElement
            canvas.addEventListener('webglcontextlost', (e) => {
              e.preventDefault()
              console.warn('WebGL context lost -- attempting recovery...')
            })
            canvas.addEventListener('webglcontextrestored', () => {
              console.info('WebGL context restored.')
            })
          }}
        >
          <SolarSystem />
          <CameraController />
        </Canvas>

        {/* UI Overlays -- HTML/CSS layered on top of 3D canvas */}
        <FactCard />
        <BackButton />
        <TimeSlider />
      </div>
    </ErrorBoundary>
  )
}
