import { useState, useEffect, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import ErrorBoundary from './components/ErrorBoundary'
import SolarSystem from './components/SolarSystem'
import CameraController from './components/CameraController'
import FactCard from './components/ui/FactCard'
import BackButton from './components/ui/BackButton'
import TimeSlider from './components/ui/TimeSlider'
import ModeToggle from './components/ui/ModeToggle'
import DiscoveryTracker from './components/ui/DiscoveryTracker'
import SoundEnableButton from './components/ui/SoundEnableButton'
import VolumeControl from './components/ui/VolumeControl'
import SizeComparison from './components/ui/SizeComparison'
import PostcardCapture from './components/ui/PostcardCapture'
import AudioManager from './components/AudioManager'
import { CAMERA } from './utils/scaleConfig'

/**
 * Root component -- Canvas filling the full viewport, with ErrorBoundary wrapping
 * everything. UI overlays (FactCard, BackButton, etc.) are HTML siblings of the
 * Canvas, layered via absolute positioning.
 *
 * Loading screen shows "Solar System Explorer" for 1.5s then fades out.
 * WebGL context loss shows a friendly overlay with a reload button.
 *
 * preserveDrawingBuffer is required for the postcard screenshot feature.
 * alpha: false gives a solid black background (faster than transparent canvas).
 */
export default function App() {
  // Loading screen state
  const [showLoading, setShowLoading] = useState(true)
  const [loadingFade, setLoadingFade] = useState(false)

  // WebGL context loss state
  const [webglLost, setWebglLost] = useState(false)

  // Loading screen: visible for 1.5s, then fade out over 1s, then remove
  useEffect(() => {
    const fadeTimer = setTimeout(() => setLoadingFade(true), 1500)
    const removeTimer = setTimeout(() => setShowLoading(false), 2500)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(removeTimer)
    }
  }, [])

  const handleReload = useCallback(() => {
    window.location.reload()
  }, [])

  const handleCanvasCreated = useCallback(({ gl }) => {
    const canvas = gl.domElement
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault()
      console.warn('WebGL context lost -- attempting recovery...')
      setWebglLost(true)
    })
    canvas.addEventListener('webglcontextrestored', () => {
      console.info('WebGL context restored.')
      setWebglLost(false)
    })
  }, [])

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
          onCreated={handleCanvasCreated}
        >
          <SolarSystem />
          <CameraController />
        </Canvas>

        {/* UI Overlays -- HTML/CSS layered on top of 3D canvas */}
        <FactCard />
        <BackButton />
        <TimeSlider />
        <ModeToggle />
        <DiscoveryTracker />
        <SoundEnableButton />
        <VolumeControl />
        <SizeComparison />
        <PostcardCapture />
        <AudioManager />

        {/* Loading screen -- z-200, fades after 1.5s */}
        {showLoading && (
          <div
            className="fixed inset-0 flex flex-col items-center justify-center bg-black text-white transition-opacity duration-1000"
            style={{
              zIndex: 200,
              opacity: loadingFade ? 0 : 1,
              pointerEvents: loadingFade ? 'none' : 'auto',
            }}
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              Solar System Explorer
            </h1>
            <p className="text-white/50 text-lg">
              Loading the universe...
            </p>
          </div>
        )}

        {/* WebGL context loss overlay -- z-300 (highest) */}
        {webglLost && (
          <div
            className="fixed inset-0 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md text-white text-center p-8"
            style={{ zIndex: 300 }}
          >
            <p className="text-2xl mb-2">The universe needs a moment...</p>
            <p className="text-white/60 mb-6">The 3D graphics context was lost. This sometimes happens on mobile devices.</p>
            <button
              onClick={handleReload}
              className="px-6 py-3 bg-blue-600 rounded-lg text-lg hover:bg-blue-500 transition-colors"
              style={{ minWidth: 44, minHeight: 44 }}
              aria-label="Reload the page"
            >
              Reload
            </button>
          </div>
        )}
      </div>
    </ErrorBoundary>
  )
}
