import { useState, useCallback } from 'react'
import useStore from '../../stores/useStore'

/**
 * Volume control -- mute/unmute toggle + slider.
 * Only visible after audio is enabled (replaces SoundEnableButton position).
 * Top-right corner.
 */
export default function VolumeControl() {
  const audioEnabled = useStore((s) => s.audioEnabled)
  const masterVolume = useStore((s) => s.masterVolume)
  const setMasterVolume = useStore((s) => s.setMasterVolume)

  const [showSlider, setShowSlider] = useState(false)
  const [prevVolume, setPrevVolume] = useState(0.5)

  // Hide until audio is enabled
  if (!audioEnabled) return null

  const isMuted = masterVolume === 0

  const handleToggleMute = useCallback(() => {
    if (isMuted) {
      setMasterVolume(prevVolume || 0.5)
    } else {
      setPrevVolume(masterVolume)
      setMasterVolume(0)
    }
  }, [isMuted, masterVolume, prevVolume, setMasterVolume])

  const handleVolumeChange = useCallback((e) => {
    const vol = parseFloat(e.target.value)
    setMasterVolume(vol)
    if (vol > 0) setPrevVolume(vol)
  }, [setMasterVolume])

  return (
    <div
      className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-3 py-2 pointer-events-auto"
      onMouseEnter={() => setShowSlider(true)}
      onMouseLeave={() => setShowSlider(false)}
    >
      {/* Mute/unmute toggle */}
      <button
        onClick={handleToggleMute}
        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white"
        aria-label={isMuted ? 'Unmute' : 'Mute'}
        style={{ minWidth: 40, minHeight: 40 }}
      >
        {isMuted ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 010 7.07" />
            {masterVolume > 0.5 && <path d="M19.07 4.93a10 10 0 010 14.14" />}
          </svg>
        )}
      </button>

      {/* Volume slider -- visible on hover */}
      {showSlider && (
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={masterVolume}
          onChange={handleVolumeChange}
          className="w-20"
          aria-label="Volume"
        />
      )}
    </div>
  )
}
