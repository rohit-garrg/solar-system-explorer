/**
 * Howler.js wrapper hook for audio playback.
 * Handles ambient loops, per-planet tones, and SFX.
 * All audio is opt-in — only plays after user enables sound.
 */
export default function useAudio() {
  // TODO: Howler instance management, play/pause/fade, visibility change handling
  return {
    playAmbient: () => {},
    stopAmbient: () => {},
    playPlanetTone: () => {},
    stopPlanetTone: () => {},
    playSfx: () => {},
  }
}
