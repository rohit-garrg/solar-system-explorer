import { useCallback } from 'react'
import useStore from '../../stores/useStore'
import { MOONS } from '../../utils/scaleConfig'

/**
 * Navigation button — always visible (except in size comparison mode).
 * Shows a back arrow when a body is selected (clears selection),
 * or a home icon when the camera has been panned away (resets view).
 *
 * Progressive navigation: moon -> parent planet -> overview.
 */
export default function BackButton() {
  const selectedBody = useStore((s) => s.selectedBody)
  const sizeComparisonMode = useStore((s) => s.sizeComparisonMode)
  const clearSelection = useStore((s) => s.clearSelection)
  const selectBody = useStore((s) => s.selectBody)
  const resetView = useStore((s) => s.resetView)

  const handleClick = useCallback(() => {
    if (selectedBody) {
      // If it's a moon, navigate to its parent planet first
      if (MOONS[selectedBody]) {
        selectBody(MOONS[selectedBody].parent)
      } else {
        clearSelection()
      }
    } else {
      resetView()
    }
  }, [selectedBody, clearSelection, selectBody, resetView])

  // Hide in size comparison mode — that mode has its own toggle
  if (sizeComparisonMode) return null

  return (
    <button
      onClick={handleClick}
      className="fixed top-4 left-4 z-50 w-12 h-12 flex items-center justify-center rounded-full bg-black/60 backdrop-blur-sm text-white hover:bg-black/80 transition-colors"
      aria-label={selectedBody ? 'Back to overview' : 'Reset camera'}
      style={{ minWidth: 48, minHeight: 48 }}
    >
      {selectedBody ? (
        /* Back arrow */
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      ) : (
        /* Home icon */
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      )}
    </button>
  )
}
