import { useCallback } from 'react'
import useStore from '../../stores/useStore'

/**
 * Back button — returns camera to default overview, clears selection.
 * Only visible when a body is selected.
 * Fixed top-left, 48x48px with a left arrow.
 */
export default function BackButton() {
  const selectedBody = useStore((s) => s.selectedBody)
  const clearSelection = useStore((s) => s.clearSelection)

  const handleClick = useCallback(() => {
    clearSelection()
  }, [clearSelection])

  if (!selectedBody) return null

  return (
    <button
      onClick={handleClick}
      className="fixed top-4 left-4 z-50 w-12 h-12 flex items-center justify-center rounded-full bg-black/60 backdrop-blur-sm text-white hover:bg-black/80 transition-colors"
      aria-label="Back to overview"
      style={{ minWidth: 48, minHeight: 48 }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6" />
      </svg>
    </button>
  )
}
