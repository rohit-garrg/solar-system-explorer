import usePerformance from '../hooks/usePerformance'

/**
 * PerformanceMonitor -- calls the FPS tracking hook and returns null.
 * Must live inside <Canvas> (usePerformance uses useFrame).
 * Automatically adjusts qualityLevel in the store based on FPS.
 */
export default function PerformanceMonitor() {
  usePerformance()
  return null
}
