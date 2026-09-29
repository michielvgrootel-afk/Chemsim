// Helpers for the ideal-gas simulation.
//
// The gas fills the region between the left wall and the piston (x = pistonX).
// Volume is measured on the area that the centres of ideal-size particles
// (radius gc.refRadius) can reach, so the wall-collision pressure gauge reads
// PV = nRT for an ideal gas.
//
// Unit calibration: every particle's kinetic energy is speedK·T/2 whatever its
// mass (equipartition), so for ideal particles the 2D pressure obeys
// P2D · area = N · (speedK/2) · T. Converting with
//   kPa = P2D · molPerParticle · R / ((speedK/2) · dm³-per-px²)
// makes the displayed P, V, n and T satisfy PV = nRT.

export const R = 8.314

function accessibleArea(gc, pistonX, height) {
  const r = gc.refRadius
  return Math.max(1, (pistonX - 2 * r) * (height - 2 * r))
}

export function maxPistonX(gc, width) {
  return width - gc.pistonMargin
}

// dm³ per px², chosen so the fully open container holds gc.maxVolume
function volumeScale(gc, width, height) {
  return gc.maxVolume / accessibleArea(gc, maxPistonX(gc, width), height)
}

export function volumeFromPiston(gc, pistonX, width, height) {
  return volumeScale(gc, width, height) * accessibleArea(gc, pistonX, height)
}

export function pistonFromVolume(gc, volume, width, height) {
  const area = volume / volumeScale(gc, width, height)
  return area / (height - 2 * gc.refRadius) + 2 * gc.refRadius
}

export function pressureToKPa(gc, pressure2D, width, height) {
  return pressure2D * gc.molPerParticle * R / ((gc.speedK / 2) * volumeScale(gc, width, height))
}

export function idealPressure2D(gc, particleCount, temperature, pistonX, height) {
  return particleCount * (gc.speedK / 2) * temperature / accessibleArea(gc, pistonX, height)
}

// Length of wall the particle centres can touch (for force per unit length)
export function wallPerimeter(gc, pistonX, height) {
  const r = gc.refRadius
  return 2 * ((pistonX - 2 * r) + (height - 2 * r))
}

export function kPaToPressure2D(gc, kPa, width, height) {
  return kPa * (gc.speedK / 2) * volumeScale(gc, width, height) / (gc.molPerParticle * R)
}

// Real gas pressure from the van der Waals equation:
//   P = nRT / (V − nb) − a·n²/V²
// (b: volume taken up by the particles themselves; a: attractions).
export function vanDerWaalsPressure({ a, b }, n, V, T) {
  const freeVolume = Math.max(0.05 * V, V - n * b)
  return Math.max(0, (n * R * T) / freeVolume - (a * n * n) / (V * V))
}

// Real-gas intermolecular attraction (visual): a short-range pull between
// particles whose surfaces are less than `range` apart, so slow particles
// cluster at low temperature.
export function applyGasAttraction(grid, dt, strength, range) {
  for (const [a, b] of grid.getPotentialPairs()) {
    if (!a.alive || !b.alive) continue
    const dx = b.x - a.x
    const dy = b.y - a.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    const contact = a.radius + b.radius
    if (dist <= contact || dist >= contact + range) continue
    const f = strength * (1 - (dist - contact) / range) * dt
    const nx = dx / dist
    const ny = dy / dist
    a.vx += (nx * f) / a.mass
    a.vy += (ny * f) / a.mass
    b.vx -= (nx * f) / b.mass
    b.vy -= (ny * f) / b.mass
  }
}
