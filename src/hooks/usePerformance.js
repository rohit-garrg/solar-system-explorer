import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import useStore from '../stores/useStore'

const WINDOW_SIZE = 60       // Rolling window of frame timestamps
const CHECK_INTERVAL = 3000  // Check FPS every 3 seconds (ms)
const LOW_THRESHOLD = 20     // Below this -> 'low'
const MED_THRESHOLD = 30     // Below this -> 'medium'
const HIGH_THRESHOLD = 50    // Above this -> 'high' (hysteresis avoids flapping)

/**
 * FPS monitoring hook -- tracks a rolling window of frame timestamps
 * and adjusts the quality level in the store every 3 seconds.
 *
 * Uses performance.now() timestamps (not deltas) for accuracy.
 * Quality only changes when crossing thresholds, with hysteresis:
 *   < 20 FPS -> 'low'
 *   < 30 FPS -> 'medium'
 *   > 50 FPS -> 'high'
 * The gap between 30-50 prevents rapid toggling between levels.
 *
 * Must be called inside a component rendered within <Canvas>.
 */
export default function usePerformance() {
  const timestamps = useRef([])
  const lastCheck = useRef(performance.now())

  useFrame(() => {
    const now = performance.now()

    // Push current timestamp into rolling window
    timestamps.current.push(now)

    // Keep only the most recent WINDOW_SIZE frames
    if (timestamps.current.length > WINDOW_SIZE) {
      timestamps.current.shift()
    }

    // Only evaluate every CHECK_INTERVAL ms
    if (now - lastCheck.current < CHECK_INTERVAL) return
    lastCheck.current = now

    // Need at least 10 frames to compute meaningful FPS
    const ts = timestamps.current
    if (ts.length < 10) return

    // Average FPS from the rolling window
    const elapsed = ts[ts.length - 1] - ts[0]
    if (elapsed <= 0) return
    const avgFps = ((ts.length - 1) / elapsed) * 1000

    const currentLevel = useStore.getState().qualityLevel

    let newLevel = currentLevel
    if (avgFps < LOW_THRESHOLD) {
      newLevel = 'low'
    } else if (avgFps < MED_THRESHOLD) {
      newLevel = 'medium'
    } else if (avgFps > HIGH_THRESHOLD) {
      newLevel = 'high'
    }
    // Between MED_THRESHOLD and HIGH_THRESHOLD: keep current level (hysteresis)

    if (newLevel !== currentLevel) {
      useStore.getState().setQualityLevel(newLevel)
    }
  })
}
