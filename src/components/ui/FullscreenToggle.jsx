import { useState, useEffect, useCallback } from 'react'

// Cross-browser fullscreen helpers (standard + webkit prefix for Safari)
function isFullscreenSupported() {
  return !!(document.fullscreenEnabled || document.webkitFullscreenEnabled)
}

function getFullscreenElement() {
  return document.fullscreenElement || document.webkitFullscreenElement
}

function requestFullscreen(el) {
  if (el.requestFullscreen) return el.requestFullscreen()
  if (el.webkitRequestFullscreen) return el.webkitRequestFullscreen()
}

function exitFullscreen() {
  if (document.exitFullscreen) return document.exitFullscreen()
  if (document.webkitExitFullscreen) return document.webkitExitFullscreen()
}

/**
 * FullscreenToggle -- button to enter/exit browser fullscreen mode.
 * Uses the Fullscreen API with webkit fallback for Safari.
 * Hidden on devices that don't support it (e.g. iPhone Safari).
 */
export default function FullscreenToggle() {
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Sync state when fullscreen changes (Esc key, other triggers)
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!getFullscreenElement())
    document.addEventListener('fullscreenchange', onChange)
    document.addEventListener('webkitfullscreenchange', onChange)
    return () => {
      document.removeEventListener('fullscreenchange', onChange)
      document.removeEventListener('webkitfullscreenchange', onChange)
    }
  }, [])

  const toggle = useCallback(() => {
    if (getFullscreenElement()) {
      exitFullscreen()
    } else {
      requestFullscreen(document.documentElement)
    }
  }, [])

  // Hide if Fullscreen API is not available (e.g. iPhone Safari)
  if (!isFullscreenSupported()) return null

  return (
    <button
      onClick={toggle}
      className="fixed top-[7.5rem] right-4 z-50 w-12 h-12 flex items-center justify-center rounded-full bg-black/60 backdrop-blur-sm text-white hover:bg-black/80 transition-colors"
      style={{ minWidth: 48, minHeight: 48 }}
      aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
      title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
    >
      {isFullscreen ? (
        /* Compress / minimize icon */
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="4 14 8 14 8 18" />
          <polyline points="20 10 16 10 16 6" />
          <line x1="14" y1="10" x2="21" y2="3" />
          <line x1="3" y1="21" x2="10" y2="14" />
        </svg>
      ) : (
        /* Expand / maximize icon */
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 3 21 3 21 9" />
          <polyline points="9 21 3 21 3 15" />
          <line x1="21" y1="3" x2="14" y2="10" />
          <line x1="3" y1="21" x2="10" y2="14" />
        </svg>
      )}
    </button>
  )
}
