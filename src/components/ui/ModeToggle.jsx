import { useCallback, useState, useEffect, useRef } from 'react'
import useStore from '../../stores/useStore'

/**
 * Spacecraft mode toggle -- rocket button on the right side.
 * When active (blue), clicking a planet sends the spacecraft there.
 * When inactive (dark), clicking a planet selects it normally.
 * Shows a tooltip on first activation to explain the mechanic.
 */
export default function ModeToggle() {
  const spacecraftMode = useStore((s) => s.spacecraftMode)
  const toggleSpacecraftMode = useStore((s) => s.toggleSpacecraftMode)
  const [showTooltip, setShowTooltip] = useState(false)
  const hasShownTooltip = useRef(false)

  const handleClick = useCallback(() => {
    toggleSpacecraftMode()
  }, [toggleSpacecraftMode])

  // Show tooltip on first activation, auto-dismiss after 4s
  useEffect(() => {
    if (spacecraftMode && !hasShownTooltip.current) {
      hasShownTooltip.current = true
      setShowTooltip(true)
      const timer = setTimeout(() => setShowTooltip(false), 4000)
      return () => clearTimeout(timer)
    }
    if (!spacecraftMode) {
      setShowTooltip(false)
    }
  }, [spacecraftMode])

  const activeClass = spacecraftMode
    ? 'bg-blue-600 hover:bg-blue-500'
    : 'bg-black/60 hover:bg-black/80'

  return (
    <>
      <button
        onClick={handleClick}
        className={`fixed right-4 top-1/2 z-50 w-12 h-12 flex items-center justify-center rounded-full backdrop-blur-sm text-white transition-colors ${activeClass}`}
        style={{ transform: 'translateY(-50%)', minWidth: 48, minHeight: 48 }}
        aria-label={spacecraftMode ? 'Disable spacecraft mode' : 'Enable spacecraft mode'}
        title={spacecraftMode ? 'Spacecraft mode ON' : 'Spacecraft mode OFF'}
      >
        {/* Rocket SVG icon */}
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2C12 2 6 8 6 14a6 6 0 0012 0c0-6-6-12-6-12z" />
          <path d="M12 18v4" />
          <path d="M8 22h8" />
          <circle cx="12" cy="13" r="2" fill="currentColor" />
        </svg>
      </button>

      {/* First-activation tooltip */}
      {showTooltip && (
        <div
          className="fixed right-[4.5rem] top-1/2 z-50 bg-blue-600 text-white text-sm px-3 py-2 rounded-lg shadow-lg whitespace-nowrap"
          style={{ transform: 'translateY(-50%)', animation: 'fadeIn 0.3s ease-out' }}
        >
          Tap any planet to fly there!
          <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-0 h-0 border-y-[6px] border-y-transparent border-l-[6px] border-l-blue-600" />
        </div>
      )}
    </>
  )
}
