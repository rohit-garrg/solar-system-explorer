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
  } = useAudio()

  const prevFlying = useRef(false)

  // Subscribe to audioEnabled -- start/stop ambient
  useEffect(() => {
    const unsub = useStore.subscribe(
      (s) => s.audioEnabled,
      (enabled) => {
        if (enabled) {
          playAmbient()
        } else {
          stopAmbient()
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
        const { audioEnabled } = useStore.getState()
        if (!audioEnabled) return

        if (body) {
          playPlanetTone(body)
        } else {
          stopPlanetTone()
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
        if (isFlying && !prevFlying.current) {
          playSfx('whoosh')
        } else if (!isFlying && prevFlying.current) {
          playSfx('arrive')
        }
        prevFlying.current = isFlying
      },
    )
    return unsub
  }, [playSfx])

  // Subscribe to masterVolume -- update all playing audio volumes
  useEffect(() => {
    const unsub = useStore.subscribe(
      (s) => s.masterVolume,
      (vol) => {
        updateVolume(vol)
      },
    )
    return unsub
  }, [updateVolume])

  return null
}
