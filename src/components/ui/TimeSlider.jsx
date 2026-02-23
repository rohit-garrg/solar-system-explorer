import { useEffect, useCallback } from 'react'
import useStore from '../../stores/useStore'

/**
 * Time speed control -- range slider (0.1x to 20x) with play/pause.
 * Fixed to bottom center of screen.
 *
 * Keyboard shortcuts:
 *   Space: toggle pause (preventDefault to stop page scroll)
 *   ArrowUp: speed +1 (cap at 20)
 *   ArrowDown: speed -1 (min 0.1)
 *
 * Uses useStore.getState() in the keyboard handler to avoid stale closures.
 */
export default function TimeSlider() {
  const timeSpeed = useStore((s) => s.timeSpeed)
  const isPaused = useStore((s) => s.isPaused)
  const setTimeSpeed = useStore((s) => s.setTimeSpeed)
  const togglePause = useStore((s) => s.togglePause)

  // Format speed label
  const speedLabel = timeSpeed < 1
    ? `${timeSpeed.toFixed(1)}x`
    : `${Math.round(timeSpeed * 10) / 10}x`

  const handleSliderChange = useCallback((e) => {
    setTimeSpeed(parseFloat(e.target.value))
  }, [setTimeSpeed])

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e) {
      // Don't capture keys when user is typing in an input
      if (e.target.tagName === 'INPUT' && e.target.type !== 'range') return

      const store = useStore.getState()

      if (e.code === 'Space') {
        e.preventDefault()
        store.togglePause()
      } else if (e.code === 'ArrowUp') {
        e.preventDefault()
        const next = Math.min(store.timeSpeed + 1, 20)
        store.setTimeSpeed(next)
      } else if (e.code === 'ArrowDown') {
        e.preventDefault()
        const next = Math.max(store.timeSpeed - 1, 0.1)
        store.setTimeSpeed(Math.round(next * 10) / 10)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex items-center gap-3 bg-black/60 backdrop-blur-sm rounded-full px-5 py-2.5 pointer-events-auto"
      style={{ transform: 'translateX(-50%)' }}
    >
      {/* Play/Pause button */}
      <button
        onClick={togglePause}
        className="w-11 h-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
        aria-label={isPaused ? 'Play' : 'Pause'}
        style={{ minWidth: 44, minHeight: 44 }}
      >
        {isPaused ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5,3 19,12 5,21" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <rect x="5" y="3" width="4" height="18" />
            <rect x="15" y="3" width="4" height="18" />
          </svg>
        )}
      </button>

      {/* Speed slider */}
      <input
        type="range"
        min="0.1"
        max="20"
        step="0.1"
        value={timeSpeed}
        onChange={handleSliderChange}
        className="w-32 sm:w-48"
        aria-label="Time speed"
      />

      {/* Speed label */}
      <span className="text-white text-sm font-mono min-w-[3.5rem] text-center select-none">
        {speedLabel}
      </span>

      {/* Fast forward indicator */}
      {timeSpeed > 5 && (
        <span className="text-yellow-400 text-xs font-medium animate-pulse">
          FAST
        </span>
      )}
    </div>
  )
}
