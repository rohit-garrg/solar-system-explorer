import Sun from './Sun'
import Starfield from './Starfield'

/**
 * Main 3D scene — root component inside <Canvas>.
 * Renders all celestial bodies, lights, and effects.
 *
 * ambientLight at very low intensity (0.1) ensures planets on the dark side
 * aren't completely black — a small amount of "sky glow" for readability.
 * The main illumination comes from Sun's pointLight.
 *
 * Steps 3 and 4 add Planet, OrbitLine, AsteroidBelt, and Comet.
 */
export default function SolarSystem() {
  return (
    <group>
      {/* Minimal ambient so dark sides of planets aren't pitch black */}
      <ambientLight intensity={0.1} />

      {/* The Sun — self-lit sphere + point light */}
      <Sun />

      {/* Background stars */}
      <Starfield />
    </group>
  )
}
