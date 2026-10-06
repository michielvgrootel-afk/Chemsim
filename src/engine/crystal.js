// Rigid-body motion for an undissolved ionic crystal.
//
// The ions still locked in the lattice move together as one solid. Stirring
// carries and turns the whole crystal but never pulls an ion out of it: an
// ion only leaves once it is hydrated (handled by the hydration check), and
// then drops out of the crystal for good.

export function createCrystal(particles) {
  const crystal = { cx: 0, cy: 0, angle: 0, vx: 0, vy: 0, omega: 0, members: [] }
  rebase(crystal, particles)
  return crystal
}

// Re-centre on the given particles: offsets in the world frame, angle reset
function rebase(crystal, particles) {
  const n = particles.length
  crystal.cx = particles.reduce((sum, p) => sum + p.x, 0) / n
  crystal.cy = particles.reduce((sum, p) => sum + p.y, 0) / n
  crystal.angle = 0
  crystal.members = particles.map(p => ({ p, ox: p.x - crystal.cx, oy: p.y - crystal.cy }))
}

// Put each member at its lattice position for the current pose. This also
// undoes any nudges from collisions, so the lattice never distorts.
function placeMembers(crystal, members = crystal.members) {
  const cos = Math.cos(crystal.angle)
  const sin = Math.sin(crystal.angle)
  for (const m of members) {
    const rx = m.ox * cos - m.oy * sin
    const ry = m.ox * sin + m.oy * cos
    m.p.x = crystal.cx + rx
    m.p.y = crystal.cy + ry
    m.p.vx = crystal.vx - crystal.omega * ry
    m.p.vy = crystal.vy + crystal.omega * rx
  }
}

export function crystalVelocityAt(crystal, x, y) {
  return {
    vx: crystal.vx - crystal.omega * (y - crystal.cy),
    vy: crystal.vy + crystal.omega * (x - crystal.cx),
  }
}

// Distance from (x, y) to the surface of the nearest ion in the crystal
export function distanceToCrystal(crystal, x, y) {
  let best = Infinity
  for (const { p } of crystal.members) {
    const d = Math.hypot(x - p.x, y - p.y) - p.radius
    if (d < best) best = d
  }
  return best
}

// flowAt(x, y) returns the stirring flow velocity, or flowAt is null when
// not stirring (the crystal then coasts to a stop).
export function updateCrystal(crystal, dt, flowAt, width, height, config) {
  const kept = crystal.members.filter(m => m.p.alive && !m.p.dissolved)
  if (kept.length === 0) {
    crystal.members = []
    return
  }
  if (kept.length !== crystal.members.length) {
    placeMembers(crystal, kept)
    rebase(crystal, kept.map(m => m.p))
  }

  // Follow the average flow over the crystal (a heavy solid lags the fluid)
  let targetVx = 0
  let targetVy = 0
  let targetOmega = 0
  if (flowAt) {
    let cross = 0
    let r2 = 0
    for (const { p } of crystal.members) {
      const f = flowAt(p.x, p.y)
      targetVx += f.vx
      targetVy += f.vy
      const rx = p.x - crystal.cx
      const ry = p.y - crystal.cy
      cross += rx * f.vy - ry * f.vx
      r2 += rx * rx + ry * ry
    }
    const n = crystal.members.length
    targetVx = (targetVx / n) * config.flowFollow
    targetVy = (targetVy / n) * config.flowFollow
    targetOmega = r2 > 0 ? (cross / r2) * config.flowFollow : 0
  }
  const blend = 1 - Math.exp(-(flowAt ? config.responseRate : config.settleRate) * dt)
  crystal.vx += (targetVx - crystal.vx) * blend
  crystal.vy += (targetVy - crystal.vy) * blend
  crystal.omega += (targetOmega - crystal.omega) * blend
  crystal.omega = Math.max(-config.maxSpin, Math.min(config.maxSpin, crystal.omega))

  crystal.cx += crystal.vx * dt
  crystal.cy += crystal.vy * dt
  crystal.angle += crystal.omega * dt
  placeMembers(crystal)

  // Keep the whole crystal inside the container, bouncing off the walls
  let left = Infinity, right = -Infinity, top = Infinity, bottom = -Infinity
  for (const { p } of crystal.members) {
    left = Math.min(left, p.x - p.radius)
    right = Math.max(right, p.x + p.radius)
    top = Math.min(top, p.y - p.radius)
    bottom = Math.max(bottom, p.y + p.radius)
  }
  let moved = false
  if (left < 0) { crystal.cx -= left; crystal.vx = Math.abs(crystal.vx) * config.restitution; moved = true }
  if (right > width) { crystal.cx -= right - width; crystal.vx = -Math.abs(crystal.vx) * config.restitution; moved = true }
  if (top < 0) { crystal.cy -= top; crystal.vy = Math.abs(crystal.vy) * config.restitution; moved = true }
  if (bottom > height) { crystal.cy -= bottom - height; crystal.vy = -Math.abs(crystal.vy) * config.restitution; moved = true }
  if (moved) placeMembers(crystal)
}
