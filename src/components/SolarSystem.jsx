/**
 * Main 3D scene — renders Sun, planets, asteroid belt, comets, starfield.
 * This is the root component inside the Canvas.
 */
export default function SolarSystem() {
  // TODO: Render Sun, planets with moons, asteroid belt, comets, starfield
  return (
    <group>
      <ambientLight intensity={0.1} />
    </group>
  )
}
