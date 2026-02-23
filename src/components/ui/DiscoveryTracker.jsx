import { useState, useEffect, useCallback } from 'react'
import useStore from '../../stores/useStore'
import { TOTAL_BODIES } from '../../utils/scaleConfig'

/**
 * Discovery tracker -- shows "Explored N of 22 worlds" at bottom-left.
 * Displays a congratulations overlay when all bodies have been visited.
 * visitedBodies is persisted to localStorage by the store.
 */
export default function DiscoveryTracker() {
  const visitedBodies = useStore((s) => s.visitedBodies)
  const count = visitedBodies.length

  const [showCongrats, setShowCongrats] = useState(false)
  const [prevCount, setPrevCount] = useState(count)

  // Show congrats overlay when reaching the total for the first time
  useEffect(() => {
    if (count >= TOTAL_BODIES && prevCount < TOTAL_BODIES) {
      setShowCongrats(true)
    }
    setPrevCount(count)
  }, [count, prevCount])

  const handleDismissCongrats = useCallback(() => {
    setShowCongrats(false)
  }, [])

  // Progress percentage for the bar
  const progress = Math.min((count / TOTAL_BODIES) * 100, 100)

  return (
    <>
      {/* Discovery counter -- bottom left (pushed up on mobile to avoid TimeSlider overlap) */}
      <div className="fixed bottom-16 md:bottom-4 left-4 z-40 flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-4 py-2 pointer-events-none select-none">
        {/* Small planet icon */}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6" stroke="white" strokeWidth="1.5" opacity="0.7" />
          <circle cx="8" cy="8" r="2" fill="white" opacity="0.7" />
        </svg>
        <span className="text-white/80 text-sm font-medium">
          {count} of {TOTAL_BODIES} worlds
        </span>
        {/* Mini progress bar */}
        <div className="w-12 h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-400 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Congratulations overlay */}
      {showCongrats && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
          <div className="bg-black/70 rounded-3xl p-8 max-w-sm mx-4 text-center text-white">
            <div className="text-5xl mb-4">&#127775;</div>
            <h2 className="text-2xl font-bold mb-2">Amazing Explorer!</h2>
            <p className="text-white/80 mb-6">
              You visited all {TOTAL_BODIES} worlds in the solar system!
              You're a true space explorer!
            </p>
            <button
              onClick={handleDismissCongrats}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-base font-medium transition-colors"
            >
              Keep Exploring
            </button>
          </div>
        </div>
      )}
    </>
  )
}
