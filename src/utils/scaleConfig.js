/**
 * Scale configuration — the single source of truth for all sizes,
 * distances, speeds, and tilts in the solar system.
 *
 * All values are in scene units (arbitrary, not real-world).
 * Sizes are wildly exaggerated for tappability and kid-friendliness.
 */

// Planet radii (scene units)
export const RADII = {
  sun: 8.0,
  mercury: 0.38,
  venus: 0.72,
  earth: 0.75,
  mars: 0.53,
  jupiter: 2.0,
  saturn: 1.7,
  uranus: 1.1,
  neptune: 1.05,
  pluto: 0.3,
}

// Orbital distances from Sun (scene units, center-to-center)
export const DISTANCES = {
  mercury: 18,
  venus: 23,
  earth: 28,
  mars: 34,
  jupiter: 52,
  saturn: 68,
  uranus: 84,
  neptune: 100,
  pluto: 112,
}

// Orbital speeds (radians per second at 1x time speed)
export const ORBITAL_SPEEDS = {
  mercury: 0.25,
  venus: 0.18,
  earth: 0.12,
  mars: 0.08,
  jupiter: 0.04,
  saturn: 0.025,
  uranus: 0.015,
  neptune: 0.01,
  pluto: 0.008,
}

// Rotation speeds (radians per second, self-spin at 1x)
export const ROTATION_SPEEDS = {
  sun: 0.02,
  mercury: 0.005,
  venus: -0.003, // Retrograde — Venus spins backwards
  earth: 0.15,
  mars: 0.14,
  jupiter: 0.35,
  saturn: 0.32,
  uranus: 0.25,
  neptune: 0.27,
  pluto: 0.02,
}

// Axial tilts (degrees)
export const AXIAL_TILTS = {
  mercury: 0.03,
  venus: 177.4,
  earth: 23.4,
  mars: 25.2,
  jupiter: 3.1,
  saturn: 26.7,
  uranus: 97.8,
  neptune: 28.3,
  pluto: 122.5,
}

// Moon configurations
export const MOONS = {
  moon:      { parent: 'earth',   radius: 0.2,  orbitDistance: 2.0, orbitSpeed: 0.5 },
  phobos:    { parent: 'mars',    radius: 0.08, orbitDistance: 1.0, orbitSpeed: 1.2 },
  deimos:    { parent: 'mars',    radius: 0.06, orbitDistance: 1.4, orbitSpeed: 0.8 },
  io:        { parent: 'jupiter', radius: 0.18, orbitDistance: 3.5, orbitSpeed: 0.6 },
  europa:    { parent: 'jupiter', radius: 0.16, orbitDistance: 4.2, orbitSpeed: 0.45 },
  ganymede:  { parent: 'jupiter', radius: 0.22, orbitDistance: 5.0, orbitSpeed: 0.3 },
  callisto:  { parent: 'jupiter', radius: 0.2,  orbitDistance: 6.0, orbitSpeed: 0.2 },
  titan:     { parent: 'saturn',  radius: 0.22, orbitDistance: 3.8, orbitSpeed: 0.35 },
  enceladus: { parent: 'saturn',  radius: 0.1,  orbitDistance: 2.8, orbitSpeed: 0.7 },
  titania:   { parent: 'uranus',  radius: 0.14, orbitDistance: 2.5, orbitSpeed: 0.4 },
  oberon:    { parent: 'uranus',  radius: 0.13, orbitDistance: 3.2, orbitSpeed: 0.3 },
  triton:    { parent: 'neptune', radius: 0.18, orbitDistance: 3.0, orbitSpeed: -0.4 }, // Retrograde
  charon:    { parent: 'pluto',   radius: 0.15, orbitDistance: 1.2, orbitSpeed: 0.25 },
}

// Fallback colors (hex) — used before textures load
export const FALLBACK_COLORS = {
  sun: '#FDB813',
  mercury: '#8C7E6E',
  venus: '#C4A24D',
  earth: '#2B65B8',
  mars: '#C1440E',
  jupiter: '#C88B3A',
  saturn: '#D4BE8D',
  uranus: '#73C2C6',
  neptune: '#3B5BA5',
  pluto: '#C4B59A',
  moon: '#888888',
}

// Asteroid belt bounds
export const ASTEROID_BELT = {
  innerRadius: 38,
  outerRadius: 46,
  count: 500,         // Reduced to 200 in low-quality mode
  lowCount: 200,
  rotationSpeed: 0.002,
  ySpread: 1.5,       // Random Y offset range: -1.5 to +1.5
  minSize: 0.1,
  maxSize: 0.35,
}

// Saturn ring dimensions
export const SATURN_RING = {
  innerRadius: 2.2,
  outerRadius: 3.8,
}

// Camera defaults
export const CAMERA = {
  defaultPosition: [0, 80, 120],
  defaultLookAt: [0, 0, 0],
  near: 0.1,
  far: 1000,
  minDistance: 5,
  maxDistance: 200,
  focusDistanceMultiplier: 6, // Planet focus: radius * this
}

// Hit area expansion — invisible tap targets for small bodies
export const MIN_HIT_RADIUS = 0.5
export const HIT_RADIUS_MULTIPLIER = 2.5

/**
 * Returns the tap-target radius for a body.
 * Small bodies get expanded invisible hit spheres.
 */
export function getHitRadius(visualRadius) {
  if (visualRadius >= 0.5) return visualRadius
  return Math.max(visualRadius * HIT_RADIUS_MULTIPLIER, MIN_HIT_RADIUS)
}

// Spread planets evenly around their orbits at startup.
// Exported here so it's the single source of truth (used by SolarSystem + orbitMath).
const PLANET_ORDER = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto']
export const INITIAL_ANGLES = PLANET_ORDER.reduce((acc, key, i) => {
  acc[key] = (i / PLANET_ORDER.length) * Math.PI * 2
  return acc
}, {})

// Total explorable bodies (for discovery tracker)
export const TOTAL_BODIES = 22

// Size comparison mode: planets ordered largest to smallest
export const SIZE_COMPARISON_ORDER = [
  'jupiter', 'saturn', 'uranus', 'neptune', 'earth', 'venus', 'mars', 'mercury', 'pluto',
]

// Compute X positions for size comparison lineup.
// Planets spaced so they don't overlap, with padding between them.
// Centered around X=0 for the camera preset [0, 10, 50].
const SIZE_COMP_PADDING = 2.0
const SIZE_COMP_MIN_CENTER_DISTANCE = 4.5 // Prevents label overlap for small planets
export const SIZE_COMPARISON_POSITIONS = (() => {
  const positions = {}
  let x = 0 // Start at 0, we'll center after
  let prevRadius = 0

  for (const key of SIZE_COMPARISON_ORDER) {
    const r = RADII[key]
    // Edge-based distance: previous radius + gap + this radius
    const edgeBased = prevRadius + SIZE_COMP_PADDING + r
    // Use whichever is larger so small planets don't bunch up
    const step = prevRadius === 0 ? r : Math.max(edgeBased, SIZE_COMP_MIN_CENTER_DISTANCE)
    x += prevRadius === 0 ? r : step
    positions[key] = { x, y: 0, z: 0 }
    prevRadius = r
  }

  // Total width is from the left edge of the first planet to the right edge of the last
  const firstKey = SIZE_COMPARISON_ORDER[0]
  const lastKey = SIZE_COMPARISON_ORDER[SIZE_COMPARISON_ORDER.length - 1]
  const leftEdge = positions[firstKey].x - RADII[firstKey]
  const rightEdge = positions[lastKey].x + RADII[lastKey]
  const centerOffset = (leftEdge + rightEdge) / 2

  for (const key of SIZE_COMPARISON_ORDER) {
    positions[key].x -= centerOffset
  }

  return positions
})()

// Size labels: how many Earths wide
export const SIZE_VS_EARTH = {
  jupiter: '11x Earth',
  saturn: '9x Earth',
  uranus: '4x Earth',
  neptune: '4x Earth',
  earth: '1x (Earth)',
  venus: '0.95x Earth',
  mars: '0.53x Earth',
  mercury: '0.38x Earth',
  pluto: '0.18x Earth',
}
