import { useRef, useEffect, useCallback } from 'react'
import { Howl } from 'howler'
import useStore from '../stores/useStore'

/**
 * Audio file paths -- all in public/audio/.
 * These files may not exist yet (placeholders), so every Howl
 * has onloaderror that silently degrades.
 */
const AUDIO_PATHS = {
  ambient: '/audio/ambient-space.mp3',
  planetTones: {
    sun: '/audio/planet-tones/sun.mp3',
    mercury: '/audio/planet-tones/mercury.mp3',
    venus: '/audio/planet-tones/venus.mp3',
    earth: '/audio/planet-tones/earth.mp3',
    mars: '/audio/planet-tones/mars.mp3',
    jupiter: '/audio/planet-tones/jupiter.mp3',
    saturn: '/audio/planet-tones/saturn.mp3',
    uranus: '/audio/planet-tones/uranus.mp3',
    neptune: '/audio/planet-tones/neptune.mp3',
    pluto: '/audio/planet-tones/pluto.mp3',
  },
  sfx: {
    whoosh: '/audio/sfx/whoosh.mp3',
    arrive: '/audio/sfx/arrive.mp3',
    click: '/audio/sfx/click.mp3',
  },
}

/**
 * Creates a Howl with graceful error handling.
 * Returns null if creation fails.
 */
function createHowl(src, options = {}) {
  try {
    return new Howl({
      src: [src],
      preload: true,
      onloaderror: (id, err) => {
        // Audio file not found or invalid -- this is expected for placeholders
        console.debug(`Audio not available: ${src}`, err)
      },
      onplayerror: (id, err) => {
        console.debug(`Audio play error: ${src}`, err)
      },
      ...options,
    })
  } catch (e) {
    console.debug(`Failed to create Howl for ${src}:`, e)
    return null
  }
}

/**
 * Howler.js wrapper hook for audio playback.
 *
 * - Ambient loop plays continuously when audio is enabled
 * - Planet tones play on body selection, fade out on deselection
 * - SFX (whoosh, arrive, click) are short one-shots
 * - All gated by audioEnabled and masterVolume from the store
 * - Tab visibility pause/resume via visibilitychange
 *
 * Returns: { playAmbient, stopAmbient, playPlanetTone, stopPlanetTone, playSfx }
 */
export default function useAudio() {
  const ambientRef = useRef(null)
  const currentToneRef = useRef(null)
  const currentToneKey = useRef(null)
  const sfxCache = useRef({})
  const isSetup = useRef(false)

  // Initialize ambient sound (lazy, on first call)
  const ensureSetup = useCallback(() => {
    if (isSetup.current) return
    isSetup.current = true

    // Create ambient loop
    ambientRef.current = createHowl(AUDIO_PATHS.ambient, {
      loop: true,
      volume: 0.3,
    })

    // Pre-create SFX
    Object.entries(AUDIO_PATHS.sfx).forEach(([key, path]) => {
      sfxCache.current[key] = createHowl(path, { volume: 0.5 })
    })
  }, [])

  // Pause/resume all audio when tab visibility changes
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.hidden) {
        if (ambientRef.current?.playing()) {
          ambientRef.current.pause()
        }
        if (currentToneRef.current?.playing()) {
          currentToneRef.current.pause()
        }
      } else {
        const { audioEnabled } = useStore.getState()
        if (audioEnabled) {
          if (ambientRef.current && !ambientRef.current.playing()) {
            ambientRef.current.play()
          }
          // Resume planet tone only if we still have a selected body
          const { selectedBody } = useStore.getState()
          if (selectedBody && currentToneRef.current && !currentToneRef.current.playing()) {
            currentToneRef.current.play()
          }
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  const playAmbient = useCallback(() => {
    ensureSetup()
    const { masterVolume } = useStore.getState()
    if (ambientRef.current) {
      ambientRef.current.volume(0.3 * masterVolume)
      ambientRef.current.play()
    }
  }, [ensureSetup])

  const stopAmbient = useCallback(() => {
    if (ambientRef.current) {
      ambientRef.current.fade(ambientRef.current.volume(), 0, 500)
      setTimeout(() => {
        if (ambientRef.current) ambientRef.current.stop()
      }, 500)
    }
  }, [])

  const playPlanetTone = useCallback((bodyKey) => {
    ensureSetup()
    // Stop current tone first
    if (currentToneRef.current) {
      currentToneRef.current.fade(currentToneRef.current.volume(), 0, 300)
      const old = currentToneRef.current
      setTimeout(() => old.stop(), 300)
    }

    const path = AUDIO_PATHS.planetTones[bodyKey]
    if (!path) {
      currentToneRef.current = null
      currentToneKey.current = null
      return
    }

    const { masterVolume } = useStore.getState()
    const tone = createHowl(path, { loop: true, volume: 0.4 * masterVolume })
    if (tone) {
      tone.play()
      currentToneRef.current = tone
      currentToneKey.current = bodyKey
    }
  }, [ensureSetup])

  const stopPlanetTone = useCallback(() => {
    if (currentToneRef.current) {
      currentToneRef.current.fade(currentToneRef.current.volume(), 0, 500)
      const old = currentToneRef.current
      setTimeout(() => old.stop(), 500)
      currentToneRef.current = null
      currentToneKey.current = null
    }
  }, [])

  const playSfx = useCallback((name) => {
    ensureSetup()
    const { audioEnabled, masterVolume } = useStore.getState()
    if (!audioEnabled) return

    const sound = sfxCache.current[name]
    if (sound) {
      sound.volume(0.5 * masterVolume)
      sound.play()
    }
  }, [ensureSetup])

  // Update volumes when masterVolume changes
  const updateVolume = useCallback((vol) => {
    if (ambientRef.current) {
      ambientRef.current.volume(0.3 * vol)
    }
    if (currentToneRef.current) {
      currentToneRef.current.volume(0.4 * vol)
    }
  }, [])

  return {
    playAmbient,
    stopAmbient,
    playPlanetTone,
    stopPlanetTone,
    playSfx,
    updateVolume,
  }
}
