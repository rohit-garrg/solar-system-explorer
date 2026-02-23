import { Canvas } from '@react-three/fiber'
import ErrorBoundary from './components/ErrorBoundary'
import SolarSystem from './components/SolarSystem'
import { CAMERA } from './utils/scaleConfig'

/**
 * Root component — Canvas with ErrorBoundary + UI overlay container.
 * preserveDrawingBuffer is required for the postcard screenshot feature.
 */
export default function App() {
  return (
    <ErrorBoundary>
      <div className="w-full h-full relative">
        {/* 3D Canvas */}
        <Canvas
          gl={{ preserveDrawingBuffer: true, antialias: true }}
          camera={{
            position: CAMERA.defaultPosition,
            near: CAMERA.near,
            far: CAMERA.far,
            fov: 50,
          }}
          onCreated={({ gl }) => {
            // Handle WebGL context loss gracefully
            const canvas = gl.domElement
            canvas.addEventListener('webglcontextlost', (e) => {
              e.preventDefault()
              console.warn('WebGL context lost — attempting recovery...')
            })
            canvas.addEventListener('webglcontextrestored', () => {
              console.info('WebGL context restored.')
            })
          }}
        >
          <SolarSystem />
        </Canvas>

        {/* UI Overlays (HTML on top of Canvas) */}
        {/* TODO: Add FactCard, TimeSlider, ModeToggle, etc. */}
      </div>
    </ErrorBoundary>
  )
}
