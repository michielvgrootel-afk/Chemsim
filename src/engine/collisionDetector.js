// Collision detection and elastic bounce physics

export function detectAndResolveCollisions(grid, particles) {
  const pairs = grid.getPotentialPairs()
  const collisions = []

  for (const [a, b] of pairs) {
    if (!a.alive || !b.alive) continue

    const dx = b.x - a.x
    const dy = b.y - a.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    const minDist = a.radius + b.radius

    if (dist < minDist && dist > 0) {
      // Resolve overlap
      const overlap = minDist - dist
      const nx = dx / dist
      const ny = dy / dist

      // Push apart equally
      a.x -= nx * overlap * 0.5
      a.y -= ny * overlap * 0.5
      b.x += nx * overlap * 0.5
      b.y += ny * overlap * 0.5

      // Elastic collision response
      const dvx = a.vx - b.vx
      const dvy = a.vy - b.vy
      const dvDotN = dvx * nx + dvy * ny

      // Only resolve if particles are approaching
      if (dvDotN > 0) {
        const massSum = a.mass + b.mass
        const impulse = (2 * dvDotN) / massSum

        a.vx -= impulse * b.mass * nx
        a.vy -= impulse * b.mass * ny
        b.vx += impulse * a.mass * nx
        b.vy += impulse * a.mass * ny

        // Record collision for reaction checking
        collisions.push({
          particleA: a,
          particleB: b,
          relativeSpeed: Math.sqrt(dvx * dvx + dvy * dvy),
          energy: 0.5 * (a.kineticEnergy() + b.kineticEnergy()),
        })
      }
    }
  }

  return collisions
}
