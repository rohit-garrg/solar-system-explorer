import { useEffect, useRef } from 'react'
import useStore from '../stores/useStore'
import useAudio from '../hooks/useAudio'

/**
 * AudioManager -- non-visual component that subscribes to store events
 * and triggers audio playback accordingly.
 *
 * - audioEnabled  -> start ambient loop
 * - selectedBody  -> play planet tone (fade out previous)
 * - isFlying      -> play whoosh SFX on start, arrive SFX on end
 * - masterVolume  -> update all active audio volumes
 * - tab visibility -> pause/resume all audio
 *
 * All subscribe callbacks are wrapped in try-catch so audio errors
 * never propagate through Zustand into React (which would crash the app).
 *
 * Rendered in App.jsx. Returns null (no visual output).
 */
export default function AudioManager() {
  const {
    playAmbient,
    stopAmbient,
    playPlanetTone,
    stopPlanetTone,
    playSfx,
    updateVolume,
    pauseAll,
    resumeAll,
    destroyAll,
  } = useAudio()

  const prevFlying = useRef(false)

  // Subscribe to audioEnabled -- start/stop ambient
  useEffect(() => {
    const unsub = useStore.subscribe(
      (s) => s.audioEnabled,
      (enabled) => {
        try {
          if (enabled) playAmbient()
          else stopAmbient()
        } catch (e) {
          console.warn('Audio error (ambient):', e)
        }
      },
    )
    return unsub
  }, [playAmbient, stopAmbient])

  // Subscribe to selectedBody -- play/stop planet tones
  useEffect(() => {
    const unsub = useStore.subscribe(
      (s) => s.selectedBody,
      (body) => {
        try {
          const { audioEnabled } = useStore.getState()
          if (!audioEnabled) return

          if (body) playPlanetTone(body)
          else stopPlanetTone()
        } catch (e) {
          console.warn('Audio error (planet tone):', e)
        }
      },
    )
    return unsub
  }, [playPlanetTone, stopPlanetTone])

  // Subscribe to isFlying -- play whoosh/arrive SFX
  useEffect(() => {
    const unsub = useStore.subscribe(
      (s) => s.isFlying,
      (isFlying) => {
        try {
          if (isFlying && !prevFlying.current) playSfx('whoosh')
          else if (!isFlying && prevFlying.current) playSfx('arrive')
          prevFlying.current = isFlying
        } catch (e) {
          console.warn('Audio error (sfx):', e)
        }
      },
    )
    return unsub
  }, [playSfx])

  // Subscribe to masterVolume -- update all playing audio volumes
  useEffect(() => {
    const unsub = useStore.subscribe(
      (s) => s.masterVolume,
      (vol) => {
        try {
          updateVolume(vol)
        } catch (e) {
          console.warn('Audio error (volume):', e)
        }
      },
    )
    return unsub
  }, [updateVolume])

  // Pause/resume audio when tab visibility changes
  useEffect(() => {
    function handleVisibilityChange() {
      try {
        if (document.hidden) pauseAll()
        else resumeAll()
      } catch (e) {
        console.warn('Audio error (visibility):', e)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [pauseAll, resumeAll])

  // Cleanup all audio on unmount
  useEffect(() => {
    return () => {
      try {
        destroyAll()
      } catch (e) {
        console.warn('Audio cleanup error:', e)
      }
    }
  }, [destroyAll])

  return null
}
