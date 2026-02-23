/**
 * FPS monitoring hook — tracks rolling average over 3 seconds.
 * Triggers quality level changes in the store when FPS drops.
 */
export default function usePerformance() {
  // TODO: FPS sampling, rolling average, quality adaptation
  return {
    fps: 60,
    qualityLevel: 'high',
  }
}
