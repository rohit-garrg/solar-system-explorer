import { useCallback } from 'react'
import useStore from '../../stores/useStore'

/**
 * Size comparison mode toggle -- button at top-center.
 * When active, planets line up by size largest-to-smallest
 * and the camera transitions to a side view.
 * toggleSizeComparison also pauses orbits.
 */
export default function SizeComparison() {
  const sizeComparisonMode = useStore((s) => s.sizeComparisonMode)
  const toggleSizeComparison = useStore((s) => s.toggleSizeComparison)

  const handleClick = useCallback(() => {
    // Clear selection when entering/leaving comparison mode
    const store = useStore.getState()
    if (store.selectedBody) {
      store.clearSelection()
    }
    toggleSizeComparison()
  }, [toggleSizeComparison])

  const activeClass = sizeComparisonMode
    ? 'bg-blue-600 hover:bg-blue-500'
    : 'bg-black/60 hover:bg-black/80'

  return (
    <button
      onClick={handleClick}
      className={`fixed top-4 left-1/2 z-50 flex items-center gap-2 backdrop-blur-sm rounded-full px-4 py-2.5 text-white transition-colors ${activeClass}`}
      style={{ transform: 'translateX(-50%)', minHeight: 44 }}
      aria-label={sizeComparisonMode ? 'Exit size comparison' : 'Compare planet sizes'}
    >
      {/* Scaling icon */}
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="6" cy="16" r="4" />
        <circle cx="16" cy="10" r="6" />
      </svg>
      <span className="text-sm font-medium">
        {sizeComparisonMode ? 'Back to Orbits' : 'Compare Sizes'}
      </span>
    </button>
  )
}
