/**
 * Orbit math — circular and elliptical orbit computation.
 *
 * Critical: uses absolute time (speed * elapsedTime), NOT accumulated deltas.
 * This prevents floating-point drift that would desync planets over time.
 */

/**
 * Circular orbit position (planets, moons).
 * Returns [x, y, z] in the orbital plane.
 *
 * @param {number} distance - orbital radius (scene units)
 * @param {number} speed - angular speed (radians/sec at 1x)
 * @param {number} elapsedTime - total simulation time (seconds)
 * @param {number} [initialAngle=0] - starting angle offset (radians)
 * @returns {[number, number, number]} position [x, y, z]
 */
export function circularOrbitPosition(distance, speed, elapsedTime, initialAngle = 0) {
  const angle = speed * elapsedTime + initialAngle
  return [
    distance * Math.cos(angle),
    0,
    distance * Math.sin(angle),
  ]
}

/**
 * Circular orbit angle (radians). Useful for rotating a group
 * around Y to move a planet along its orbit.
 *
 * @param {number} speed - angular speed (radians/sec at 1x)
 * @param {number} elapsedTime - total simulation time (seconds)
 * @param {number} [initialAngle=0] - starting angle offset (radians)
 * @returns {number} current angle in radians
 */
export function circularOrbitAngle(speed, elapsedTime, initialAngle = 0) {
  return speed * elapsedTime + initialAngle
}

/**
 * Solve Kepler's equation: M = E - e*sin(E)
 * Uses Newton's method to find eccentric anomaly E from mean anomaly M.
 *
 * @param {number} M - mean anomaly (radians)
 * @param {number} e - eccentricity (0 to <1)
 * @param {number} [iterations=10] - Newton's method iterations
 * @returns {number} eccentric anomaly E (radians)
 */
export function solveKepler(M, e, iterations = 10) {
  let E = M // Initial guess
  for (let i = 0; i < iterations; i++) {
    const dE = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E))
    E -= dE
    if (Math.abs(dE) < 1e-8) break // Converged
  }
  return E
}

/**
 * Elliptical orbit position (comets).
 * Computes position using Kepler's equation.
 *
 * @param {number} semiMajorAxis - semi-major axis (scene units)
 * @param {number} eccentricity - orbital eccentricity (0.9+ for comets)
 * @param {number} speed - mean motion (radians/sec at 1x)
 * @param {number} elapsedTime - total simulation time (seconds)
 * @param {number} [inclination=0] - orbital inclination (degrees)
 * @param {number} [initialAngle=0] - starting angle offset (radians)
 * @returns {[number, number, number]} position [x, y, z]
 */
export function ellipticalOrbitPosition(
  semiMajorAxis,
  eccentricity,
  speed,
  elapsedTime,
  inclination = 0,
  initialAngle = 0,
) {
  // Mean anomaly
  const M = speed * elapsedTime + initialAngle

  // Solve Kepler's equation for eccentric anomaly
  const E = solveKepler(M, eccentricity)

  // True anomaly
  const v = 2 * Math.atan2(
    Math.sqrt(1 + eccentricity) * Math.sin(E / 2),
    Math.sqrt(1 - eccentricity) * Math.cos(E / 2),
  )

  // Radius (distance from focus)
  const r = semiMajorAxis * (1 - eccentricity * Math.cos(E))

  // Position in orbital plane
  let x = r * Math.cos(v)
  let z = r * Math.sin(v)
  let y = 0

  // Apply inclination (rotate around X axis)
  if (inclination !== 0) {
    const incRad = (inclination * Math.PI) / 180
    const cosInc = Math.cos(incRad)
    const sinInc = Math.sin(incRad)
    const newY = -z * sinInc
    const newZ = z * cosInc
    y = newY
    z = newZ
  }

  return [x, y, z]
}

/**
 * Convert degrees to radians.
 */
export function degToRad(degrees) {
  return (degrees * Math.PI) / 180
}

/**
 * Linear interpolation — used for smooth camera transitions.
 */
export function lerp(start, end, t) {
  return start + (end - start) * t
}

/**
 * Get a body's current world-space position given elapsed simulation time.
 * Handles Sun (origin), planets (circular orbit), and moons (offset from parent).
 *
 * MOONS in scaleConfig is keyed by moon name, with a `parent` field.
 * moons.json is keyed by parent planet.
 */
import { DISTANCES, ORBITAL_SPEEDS, MOONS, INITIAL_ANGLES } from './scaleConfig'
import cometsData from '../data/comets.json'

// Build a lookup map for comet data by key
const cometsByKey = {}
cometsData.forEach((c) => { cometsByKey[c.key] = c })

export function getBodyWorldPosition(bodyKey, elapsedTime) {
  // Sun is always at origin
  if (bodyKey === 'sun') return [0, 0, 0]

  // Planet — circular orbit around Sun
  if (DISTANCES[bodyKey] !== undefined) {
    const angle = ORBITAL_SPEEDS[bodyKey] * elapsedTime + (INITIAL_ANGLES[bodyKey] || 0)
    return [
      DISTANCES[bodyKey] * Math.cos(angle),
      0,
      DISTANCES[bodyKey] * Math.sin(angle),
    ]
  }

  // Moon — offset from parent planet's position
  if (MOONS[bodyKey]) {
    const moon = MOONS[bodyKey]
    const parentPos = getBodyWorldPosition(moon.parent, elapsedTime)
    const moonAngle = moon.orbitSpeed * elapsedTime
    return [
      parentPos[0] + moon.orbitDistance * Math.cos(moonAngle),
      parentPos[1],
      parentPos[2] + moon.orbitDistance * Math.sin(moonAngle),
    ]
  }

  // Comet — elliptical orbit
  if (cometsByKey[bodyKey]) {
    const c = cometsByKey[bodyKey]
    return ellipticalOrbitPosition(
      c.semiMajorAxis,
      c.eccentricity,
      c.speed,
      elapsedTime,
      c.inclination,
      0,
    )
  }

  // Fallback — unknown body
  return [0, 0, 0]
}
