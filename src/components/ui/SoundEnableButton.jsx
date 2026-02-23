import { useCallback } from 'react'
import useStore from '../../stores/useStore'

/**
 * First-load audio opt-in button.
 * Shows "Turn on Sound" until the user taps it.
 * Browser autoplay policy requires user interaction before AudioContext.
 * Once audio is enabled, this button disappears (VolumeControl takes over).
 */
export default function SoundEnableButton() {
  const audioEnabled = useStore((s) => s.audioEnabled)
  const enableAudio = useStore((s) => s.enableAudio)

  const handleClick = useCallback(() => {
    enableAudio()
  }, [enableAudio])

  // Hide once audio is enabled
  if (audioEnabled) return null

  return (
    <button
      onClick={handleClick}
      className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-4 py-2.5 text-white hover:bg-black/80 transition-colors"
      style={{ minHeight: 44 }}
      aria-label="Turn on sound"
    >
      {/* Speaker icon */}
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M15.54 8.46a5 5 0 010 7.07" />
        <path d="M19.07 4.93a10 10 0 010 14.14" />
      </svg>
      <span className="text-sm font-medium">Turn on Sound</span>
    </button>
  )
}
