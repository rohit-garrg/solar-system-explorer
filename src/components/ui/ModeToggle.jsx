import { useCallback } from 'react'
import useStore from '../../stores/useStore'

/**
 * Spacecraft mode toggle -- rocket button on the right side.
 * When active (blue), clicking a planet sends the spacecraft there.
 * When inactive (dark), clicking a planet selects it normally.
 */
export default function ModeToggle() {
  const spacecraftMode = useStore((s) => s.spacecraftMode)
  const toggleSpacecraftMode = useStore((s) => s.toggleSpacecraftMode)

  const handleClick = useCallback(() => {
    toggleSpacecraftMode()
  }, [toggleSpacecraftMode])

  const activeClass = spacecraftMode
    ? 'bg-blue-600 hover:bg-blue-500'
    : 'bg-black/60 hover:bg-black/80'

  return (
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
  )
}
