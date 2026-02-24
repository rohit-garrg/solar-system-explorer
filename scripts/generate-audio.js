/**
 * Generate placeholder audio files (WAV format) for the Solar System Explorer.
 *
 * Creates synthesized tones so the sound system has real audio to play.
 * Replace these with proper sound-designed audio later.
 *
 * Usage: node scripts/generate-audio.js
 */

import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const PUBLIC = join(import.meta.dirname, '..', 'public', 'audio')

// Ensure directories exist
mkdirSync(join(PUBLIC, 'planet-tones'), { recursive: true })
mkdirSync(join(PUBLIC, 'sfx'), { recursive: true })

const SAMPLE_RATE = 44100

/**
 * Write a WAV file from a Float32Array of samples (-1 to 1).
 */
function writeWav(filePath, samples) {
  const numSamples = samples.length
  const bytesPerSample = 2 // 16-bit PCM
  const dataSize = numSamples * bytesPerSample
  const buffer = Buffer.alloc(44 + dataSize)

  // WAV header
  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(36 + dataSize, 4)
  buffer.write('WAVE', 8)
  buffer.write('fmt ', 12)
  buffer.writeUInt32LE(16, 16)        // chunk size
  buffer.writeUInt16LE(1, 20)         // PCM format
  buffer.writeUInt16LE(1, 22)         // mono
  buffer.writeUInt32LE(SAMPLE_RATE, 24)
  buffer.writeUInt32LE(SAMPLE_RATE * bytesPerSample, 28) // byte rate
  buffer.writeUInt16LE(bytesPerSample, 32)  // block align
  buffer.writeUInt16LE(16, 34)        // bits per sample
  buffer.write('data', 36)
  buffer.writeUInt32LE(dataSize, 40)

  // Write PCM samples
  for (let i = 0; i < numSamples; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]))
    const val = Math.round(clamped * 32767)
    buffer.writeInt16LE(val, 44 + i * 2)
  }

  writeFileSync(filePath, buffer)
  console.log(`  Created: ${filePath}`)
}

/**
 * Generate a sine wave tone with optional fade-in/out.
 */
function generateTone(frequency, duration, volume = 0.5, fadeIn = 0.05, fadeOut = 0.05) {
  const numSamples = Math.floor(SAMPLE_RATE * duration)
  const samples = new Float32Array(numSamples)
  const fadeInSamples = Math.floor(SAMPLE_RATE * fadeIn)
  const fadeOutSamples = Math.floor(SAMPLE_RATE * fadeOut)

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE
    let sample = Math.sin(2 * Math.PI * frequency * t) * volume

    // Fade in
    if (i < fadeInSamples) {
      sample *= i / fadeInSamples
    }
    // Fade out
    if (i > numSamples - fadeOutSamples) {
      sample *= (numSamples - i) / fadeOutSamples
    }

    samples[i] = sample
  }
  return samples
}

/**
 * Generate a chord (multiple frequencies layered).
 */
function generateChord(frequencies, duration, volume = 0.3, fadeIn = 0.1, fadeOut = 0.3) {
  const numSamples = Math.floor(SAMPLE_RATE * duration)
  const samples = new Float32Array(numSamples)
  const fadeInSamples = Math.floor(SAMPLE_RATE * fadeIn)
  const fadeOutSamples = Math.floor(SAMPLE_RATE * fadeOut)
  const perFreqVol = volume / frequencies.length

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE
    let sample = 0
    for (const freq of frequencies) {
      sample += Math.sin(2 * Math.PI * freq * t) * perFreqVol
    }

    // Fade in/out
    if (i < fadeInSamples) sample *= i / fadeInSamples
    if (i > numSamples - fadeOutSamples) sample *= (numSamples - i) / fadeOutSamples

    samples[i] = sample
  }
  return samples
}

/**
 * Generate ambient drone — layered low frequencies with slow modulation.
 */
function generateAmbientDrone(duration) {
  const numSamples = Math.floor(SAMPLE_RATE * duration)
  const samples = new Float32Array(numSamples)

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE
    // Low drone layers
    let sample = 0
    sample += Math.sin(2 * Math.PI * 55 * t) * 0.15      // A1
    sample += Math.sin(2 * Math.PI * 82.5 * t) * 0.1      // E2 (fifth)
    sample += Math.sin(2 * Math.PI * 110 * t) * 0.08       // A2 (octave)
    // Slow LFO modulation for shimmer
    const lfo = 0.8 + 0.2 * Math.sin(2 * Math.PI * 0.1 * t)
    sample *= lfo

    // Fade in first 0.5s, fade out last 0.5s
    const fadeIn = 0.5, fadeOut = 0.5
    if (t < fadeIn) sample *= t / fadeIn
    if (t > duration - fadeOut) sample *= (duration - t) / fadeOut

    samples[i] = sample
  }
  return samples
}

/**
 * Generate a quick click sound.
 */
function generateClick() {
  const duration = 0.08
  const numSamples = Math.floor(SAMPLE_RATE * duration)
  const samples = new Float32Array(numSamples)

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE
    // Sharp attack, fast decay
    const envelope = Math.exp(-t * 60)
    samples[i] = (Math.sin(2 * Math.PI * 800 * t) * 0.3 +
                  Math.sin(2 * Math.PI * 1200 * t) * 0.2) * envelope
  }
  return samples
}

/**
 * Generate a whoosh sound (noise swept through a filter-like envelope).
 */
function generateWhoosh() {
  const duration = 0.6
  const numSamples = Math.floor(SAMPLE_RATE * duration)
  const samples = new Float32Array(numSamples)

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE
    const normalized = t / duration
    // Bell-shaped volume envelope
    const envelope = Math.sin(Math.PI * normalized) * 0.4
    // Mix of noise-like content using inharmonic frequencies
    let sample = 0
    sample += Math.sin(2 * Math.PI * (200 + 2000 * normalized) * t) * 0.3
    sample += Math.sin(2 * Math.PI * (400 + 1500 * normalized) * t) * 0.2
    sample += Math.sin(2 * Math.PI * (800 + 1000 * normalized) * t) * 0.15
    // Add some pseudo-noise
    sample += (Math.sin(t * 12345.6789) * Math.cos(t * 98765.4321)) * 0.2
    samples[i] = sample * envelope
  }
  return samples
}

/**
 * Generate an arrival chime (ascending notes).
 */
function generateArrive() {
  const duration = 0.8
  const numSamples = Math.floor(SAMPLE_RATE * duration)
  const samples = new Float32Array(numSamples)
  const notes = [523.25, 659.25, 783.99] // C5, E5, G5

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE
    let sample = 0
    for (let n = 0; n < notes.length; n++) {
      const noteStart = n * 0.15
      const noteT = t - noteStart
      if (noteT > 0) {
        const env = Math.exp(-noteT * 4) * 0.3
        sample += Math.sin(2 * Math.PI * notes[n] * noteT) * env
      }
    }
    samples[i] = sample
  }
  return samples
}

// Planet tone frequencies — each planet gets a unique chord that evokes its character
const PLANET_TONES = {
  sun:     [220, 330, 440],        // A3 major — warm, bright
  mercury: [659, 880, 1047],       // E5 high — quick, small
  venus:   [349, 440, 523],        // F4 major — warm
  earth:   [261, 329, 392],        // C4 major — home
  mars:    [196, 246, 293],        // G3 minor — deep, red
  jupiter: [130, 164, 196],        // C3 major — big, majestic
  saturn:  [146, 185, 220],        // D3 major — regal
  uranus:  [277, 349, 415],        // Db4 major — unusual
  neptune: [164, 207, 246],        // E3 minor — deep, mysterious
  pluto:   [440, 554, 659],        // A4 major — distant, ethereal
}

console.log('Generating placeholder audio files...\n')

// Ambient drone (5 seconds, designed to loop)
console.log('Ambient:')
writeWav(join(PUBLIC, 'ambient-space.wav'), generateAmbientDrone(5))

// Planet tones (2 seconds each)
console.log('\nPlanet tones:')
for (const [planet, freqs] of Object.entries(PLANET_TONES)) {
  writeWav(
    join(PUBLIC, 'planet-tones', `${planet}.wav`),
    generateChord(freqs, 2, 0.3, 0.1, 0.5)
  )
}

// SFX
console.log('\nSFX:')
writeWav(join(PUBLIC, 'sfx', 'click.wav'), generateClick())
writeWav(join(PUBLIC, 'sfx', 'whoosh.wav'), generateWhoosh())
writeWav(join(PUBLIC, 'sfx', 'arrive.wav'), generateArrive())

console.log('\nDone! Generated WAV files in public/audio/')
console.log('Note: The app references .mp3 paths — update useAudio.js paths or convert files.')
