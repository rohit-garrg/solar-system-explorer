import { Howl, Howler } from 'howler'
import useStore from '../stores/useStore'

/**
 * Audio file paths -- all in public/audio/.
 * These files may not exist yet (placeholders), so every Howl
 * has onloaderror that silently degrades.
 */
const AUDIO_PATHS = {
  ambient: '/audio/ambient-space.wav',
  planetTones: {
    sun: '/audio/planet-tones/sun.wav',
    mercury: '/audio/planet-tones/mercury.wav',
    venus: '/audio/planet-tones/venus.wav',
    earth: '/audio/planet-tones/earth.wav',
    mars: '/audio/planet-tones/mars.wav',
    jupiter: '/audio/planet-tones/jupiter.wav',
    saturn: '/audio/planet-tones/saturn.wav',
    uranus: '/audio/planet-tones/uranus.wav',
    neptune: '/audio/planet-tones/neptune.wav',
    pluto: '/audio/planet-tones/pluto.wav',
  },
  sfx: {
    whoosh: '/audio/sfx/whoosh.wav',
    arrive: '/audio/sfx/arrive.wav',
    click: '/audio/sfx/click.wav',
  },
}

/**
 * Safely plays a Howl instance. Catches errors from missing/invalid audio files
 * so the app never crashes when audio is unavailable.
 */
function safePlay(howl) {
  if (!howl) return
  try {
    // 'unloaded' means the source failed to load — playing would throw
    if (howl.state() === 'unloaded') return
    howl.play()
  } catch (e) {
    console.warn('Audio play failed:', e)
  }
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
        console.warn(`Audio not available: ${src}`, err)
      },
      onplayerror: (id, err) => {
        console.warn(`Audio play error: ${src}`, err)
      },
      ...options,
    })
  } catch (e) {
    console.warn(`Failed to create Howl for ${src}:`, e)
    return null
  }
}

// ── Module-level singleton state ──────────────────────────────────────
// Shared across all consumers of useAudio(). This ensures only one
// ambient sound, one SFX cache, and one AudioContext resume ever exist.
let ambientHowl = null
let currentTone = null
let currentToneKey = null
const sfxCache = {}
let isSetup = false

/**
 * Initialize ambient sound and SFX cache (lazy, on first call).
 * Does NOT resume AudioContext — that must happen in a user gesture
 * handler (see SoundEnableButton.jsx).
 */
function ensureSetup() {
  if (isSetup) return
  isSetup = true

  // Create ambient loop
  ambientHowl = createHowl(AUDIO_PATHS.ambient, {
    loop: true,
    volume: 0.3,
  })

  // Pre-create SFX
  Object.entries(AUDIO_PATHS.sfx).forEach(([key, path]) => {
    sfxCache[key] = createHowl(path, { volume: 0.5 })
  })
}

function playAmbient() {
  ensureSetup()
  const { masterVolume } = useStore.getState()
  if (ambientHowl) {
    ambientHowl.volume(0.3 * masterVolume)
    safePlay(ambientHowl)
  }
}

function stopAmbient() {
  if (ambientHowl) {
    ambientHowl.fade(ambientHowl.volume(), 0, 500)
    setTimeout(() => {
      if (ambientHowl) ambientHowl.stop()
    }, 500)
  }
}

function playPlanetTone(bodyKey) {
  ensureSetup()
  // Stop current tone first
  if (currentTone) {
    currentTone.fade(currentTone.volume(), 0, 300)
    const old = currentTone
    setTimeout(() => old.stop(), 300)
  }

  const path = AUDIO_PATHS.planetTones[bodyKey]
  if (!path) {
    currentTone = null
    currentToneKey = null
    return
  }

  const { masterVolume } = useStore.getState()
  const tone = createHowl(path, { loop: true, volume: 0.4 * masterVolume })
  if (tone) {
    safePlay(tone)
    currentTone = tone
    currentToneKey = bodyKey
  }
}

function stopPlanetTone() {
  if (currentTone) {
    currentTone.fade(currentTone.volume(), 0, 500)
    const old = currentTone
    setTimeout(() => old.stop(), 500)
    currentTone = null
    currentToneKey = null
  }
}

function playSfx(name) {
  ensureSetup()
  const { audioEnabled, masterVolume } = useStore.getState()
  if (!audioEnabled) return

  const sound = sfxCache[name]
  if (sound) {
    sound.volume(0.5 * masterVolume)
    safePlay(sound)
  }
}

function updateVolume(vol) {
  if (ambientHowl) {
    ambientHowl.volume(0.3 * vol)
  }
  if (currentTone) {
    currentTone.volume(0.4 * vol)
  }
}

/**
 * Pause all currently playing audio (used for tab visibility).
 */
function pauseAll() {
  if (ambientHowl?.playing()) ambientHowl.pause()
  if (currentTone?.playing()) currentTone.pause()
}

/**
 * Resume audio after tab becomes visible again.
 */
function resumeAll() {
  const { audioEnabled, selectedBody } = useStore.getState()
  if (!audioEnabled) return
  if (ambientHowl && !ambientHowl.playing()) safePlay(ambientHowl)
  if (selectedBody && currentTone && !currentTone.playing()) safePlay(currentTone)
}

/**
 * Stop and unload all audio. Called on AudioManager unmount.
 */
function destroyAll() {
  if (ambientHowl) { ambientHowl.unload(); ambientHowl = null }
  if (currentTone) { currentTone.unload(); currentTone = null }
  currentToneKey = null
  Object.values(sfxCache).forEach((s) => { if (s) s.unload() })
  Object.keys(sfxCache).forEach((k) => delete sfxCache[k])
  isSetup = false
}

/**
 * Howler.js wrapper hook.
 *
 * Returns references to module-level singleton functions.
 * Multiple components can call useAudio() without creating duplicate
 * Howl instances or AudioContext resumes.
 */
export default function useAudio() {
  return {
    playAmbient,
    stopAmbient,
    playPlanetTone,
    stopPlanetTone,
    playSfx,
    updateVolume,
    pauseAll,
    resumeAll,
    destroyAll,
  }
}
