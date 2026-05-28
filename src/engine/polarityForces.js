// Polarity-based attraction/repulsion forces for solubility simulation
// Similar polarity → attract (dissolves), different polarity → repel (immiscible)

const FORCE_RANGE = 100       // Max distance for force interaction (pixels)
const ATTRACT_STRENGTH = 300  // Base attraction force
const REPEL_STRENGTH = 500    // Base repulsion force
const COHESION_STRENGTH = 80  // Same-type solute cohesion (weak — just initial clustering)
const BUOYANCY_FORCE = 120    // Vertical force for buoyancy effect
const MAX_FORCE = 60          // Velocity cap per frame to prevent instability
const POLARITY_THRESHOLD = 0.5 // polarityDiff below this = attract, above = repel
const VELOCITY_DAMPING = 0.98 // Gentle damping to prevent runaway speeds

export function applyPolarityForces(particles, grid, dt, config = {}) {
  const forceRange = config.forceRange || FORCE_RANGE
  const attractStr = config.attractStrength || ATTRACT_STRENGTH
  const repelStr = config.repelStrength || REPEL_STRENGTH
  const cohesionStr = config.cohesionStrength || COHESION_STRENGTH
  const soluteTypes = config.soluteTypes || []

  // Use spatial grid to find nearby pairs efficiently
  const pairs = grid.getPotentialPairs()

  const latticeMode = config.latticeMode || false  // When true, only attract water toward bound lattice ions
  const ionRepelStr = config.ionRepelStrength || 700   // Same-charge ion repulsion magnitude
  const ionRepelRange = config.ionRepelRange || 50     // px — tight close-range only

  for (const [a, b] of pairs) {
    if (!a.alive || !b.alive) continue
    // Skip catalyst-bound particles, but allow lattice ions (water must feel their pull)
    if ((a.bound && !a.latticeIon) || (b.bound && !b.latticeIon)) continue

    // Neutral particles (polarity 0, e.g. emulsifier) have no ion-dipole or
    // like-dissolves-like forces — their interactions are handled by other
    // systems (e.g. the bond-spring in emulsifier.js). This prevents the
    // emulsifier from being repelled by both water and oil simultaneously.
    if (a.polarity === 0 || b.polarity === 0) continue

    if (latticeMode) {
      const aIon = a.latticeIon
      const bIon = b.latticeIon
      // Water-water: no ion-dipole, skip entirely (existing immiscibility behaviour)
      if (!aIon && !bIon) continue
      // Ion-ion: same-charge electrostatic repulsion (Na+/Na+ or Cl-/Cl- shouldn't touch).
      // Opposite-charge pairs (Na+/Cl-) feel no force here so we don't re-form the lattice.
      if (aIon && bIon) {
        const aCharge = Math.sign(a.charge || 0)
        const bCharge = Math.sign(b.charge || 0)
        if (aCharge !== 0 && aCharge === bCharge) {
          const dxIon = b.x - a.x
          const dyIon = b.y - a.y
          const distIon = Math.sqrt(dxIon * dxIon + dyIon * dyIon)
          if (distIon > 1 && distIon < ionRepelRange) {
            const nxIon = dxIon / distIon
            const nyIon = dyIon / distIon
            // Quadratic falloff — gentle at the edge of range, firm near contact
            const f = 1 - distIon / ionRepelRange
            const forceMag = -ionRepelStr * f * f * dt   // negative = repulsion
            const fxRaw = forceMag * nxIon
            const fyRaw = forceMag * nyIon
            const fxIon = Math.max(-MAX_FORCE, Math.min(MAX_FORCE, fxRaw))
            const fyIon = Math.max(-MAX_FORCE, Math.min(MAX_FORCE, fyRaw))
            // Bound ions are anchored — only freed ions actually move.
            if (!a.bound) { a.vx += fxIon / a.mass; a.vy += fyIon / a.mass }
            if (!b.bound) { b.vx -= fxIon / b.mass; b.vy -= fyIon / b.mass }
          }
        }
        continue
      }
      // EXCLUSIVE BONDING: a water bonded to a specific ion is locked to it —
      // other ions ignore it (no tug-of-war). Unbonded ("wandering") waters
      // CAN be pulled by any nearby ion, which is what lets the lattice recruit
      // fresh water from the bulk.
      const ion = aIon ? a : b
      const water = aIon ? b : a
      if (water.bondedIonId != null && water.bondedIonId !== ion.id) continue
    }

    const dx = b.x - a.x
    const dy = b.y - a.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist < 1 || dist > forceRange) continue

    const nx = dx / dist
    const ny = dy / dist

    // Distance falloff — stronger when closer, fades at range
    const falloff = 1 - (dist / forceRange)
    const falloffSq = falloff * falloff

    // Calculate polarity difference
    const polarityDiff = Math.abs(a.polarity - b.polarity)

    let forceMag = 0

    const aSolute = soluteTypes.includes(a.type)
    const bSolute = soluteTypes.includes(b.type)
    const bothSolute = aSolute && bSolute
    const bothSolvent = !aSolute && !bSolute

    if (polarityDiff < POLARITY_THRESHOLD) {
      // Similar polarity → ATTRACT (like dissolves like)
      const similarity = 1 - polarityDiff / POLARITY_THRESHOLD
      // Dampen solute-solute so solvent can pull them apart
      // Dampen solvent-solvent so solvent spreads evenly (like a real liquid)
      const soluteDamping = config.soluteDamping ?? 0.15
      const solventDamping = config.solventDamping ?? 0.1
      const dampen = bothSolute ? soluteDamping : bothSolvent ? solventDamping : 1
      forceMag = attractStr * similarity * dampen * falloffSq * dt
    } else {
      // Different polarity → REPEL (immiscible)
      const mismatch = (polarityDiff - POLARITY_THRESHOLD) / (2 - POLARITY_THRESHOLD)
      forceMag = -repelStr * mismatch * falloffSq * dt
    }

    // Same-type cohesion (weak — holds solute clusters together initially)
    if (bothSolute && a.type === b.type) {
      forceMag += cohesionStr * falloffSq * dt
    }

    // Apply force asymmetrically: solute feels stronger pull from solvent
    // This lets water "extract" ions from the lattice
    const fx = Math.max(-MAX_FORCE, Math.min(MAX_FORCE, forceMag * nx))
    const fy = Math.max(-MAX_FORCE, Math.min(MAX_FORCE, forceMag * ny))

    // Solute particles get a stronger pull toward solvent
    const soluteMultiplier = config.soluteMultiplier ?? 2.5
    const aMultiplier = aSolute && !bSolute ? soluteMultiplier : 1
    const bMultiplier = bSolute && !aSolute ? soluteMultiplier : 1

    // Don't apply force to bound lattice ions (they're frozen), but DO apply to the other particle
    if (!a.bound) {
      a.vx += (fx * aMultiplier) / a.mass
      a.vy += (fy * aMultiplier) / a.mass
    }
    if (!b.bound) {
      b.vx -= (fx * bMultiplier) / b.mass
      b.vy -= (fy * bMultiplier) / b.mass
    }
  }

  // Apply buoyancy (vertical force) and velocity damping
  for (const p of particles) {
    if (!p.alive || p.bound) continue
    if (p.buoyancy !== 0) {
      p.vy -= BUOYANCY_FORCE * p.buoyancy * dt
    }
    p.vx *= VELOCITY_DAMPING
    p.vy *= VELOCITY_DAMPING
  }
}

// Apply stirring: aggressive emulsification via a global turbulent flow
// field, strong enough to overcome buoyancy (oil rising) and polarity
// repulsion (water/oil pushing apart). Result: the layers genuinely
// break apart into droplets dispersed through each other.
//
// Model:
//   1. Two large counter-rotating gyres (left half clockwise, right half
//      counter-clockwise) sample each particle's position and produce a
//      target velocity. Wherever a particle is, there's a strong
//      directional pull. Crossing the midline flips the rotation, which
//      is exactly what mixes vertical layers — oil from the top gets
//      carried down the right side, water gets carried up the left.
//   2. The gyre centres wobble over time so the flow doesn't reach a
//      static fixed point.
//   3. Velocities are STEERED toward the target (blended), not just
//      added — this dominates other forces instead of being eaten by
//      damping.
//   4. Small random turbulence on top to break perfect symmetry.
//
// Must be called every frame with dt/elapsed/canvas dims.
export function applyStirring(particles, dt, elapsed, canvasWidth, canvasHeight, strength = 1) {
  if (!particles.length || !canvasWidth || !canvasHeight) return

  const W = canvasWidth
  const H = canvasHeight
  const halfW = W / 2

  // Target flow speed — px/s. Tuned to clearly beat buoyancy (~96 px/s
  // steady-state) and polarity repulsion (~50 px/s steady-state) so the
  // stirring visibly dominates.
  const targetSpeed = 360 * strength

  // Gyre centres wobble in small circles so the flow pattern isn't static.
  const wobbleR = Math.min(W, H) * 0.08
  const wobble1X = Math.cos(elapsed * 1.3) * wobbleR
  const wobble1Y = Math.sin(elapsed * 1.7) * wobbleR
  const wobble2X = Math.cos(elapsed * 1.5 + Math.PI) * wobbleR
  const wobble2Y = Math.sin(elapsed * 1.1 + Math.PI) * wobbleR

  // Frame-rate-stable steering: blend ~85% per second toward target.
  // Solves for lerp such that (1 - lerp)^(1/dt) ≈ exp(-rate)
  const steerRate = 7 * strength
  const lerp = 1 - Math.exp(-steerRate * dt)

  for (const p of particles) {
    if (!p.alive || p.bound) continue

    // Determine which gyre this particle is in, and its position relative
    // to that gyre's centre (normalized to [-1, 1]).
    let gyreCx, gyreCy, sign
    if (p.x < halfW) {
      gyreCx = halfW / 2 + wobble1X
      gyreCy = H / 2 + wobble1Y
      sign = 1   // clockwise on the left half
    } else {
      gyreCx = halfW + halfW / 2 + wobble2X
      gyreCy = H / 2 + wobble2Y
      sign = -1  // counter-clockwise on the right half
    }
    const nx = (p.x - gyreCx) / (halfW / 2)
    const ny = (p.y - gyreCy) / (H / 2)

    // Tangential velocity (perpendicular to radius) — this is the
    // rotation. Magnitude tapers slightly toward the centre so flow at
    // the gyre core isn't infinite-fast.
    const r = Math.sqrt(nx * nx + ny * ny)
    const intensity = Math.min(1, 0.25 + r * 0.9)
    let tx = -ny * sign * intensity
    let ty =  nx * sign * intensity

    // Cross-flow perturbation — extra sin-wave term that breaks symmetry
    // and pushes particles between the two gyres, dramatically increasing
    // mixing across the midline.
    const phase = elapsed * 2.2
    tx += 0.55 * Math.sin(p.y / H * Math.PI * 2 + phase)
    ty += 0.55 * Math.cos(p.x / W * Math.PI * 2 - phase)

    // Normalize the direction and scale to target speed.
    const mag = Math.sqrt(tx * tx + ty * ty) || 1
    const fx = (tx / mag) * targetSpeed
    const fy = (ty / mag) * targetSpeed

    // Steer toward the target velocity (blended).
    p.vx = p.vx * (1 - lerp) + fx * lerp
    p.vy = p.vy * (1 - lerp) + fy * lerp
  }

  // Random turbulence on top — kicks particles around so the smooth flow
  // field doesn't lock them into perfect orbits. Strong enough to make
  // visible chaos but not enough to dominate the gyres.
  const jitter = 120 * strength * dt
  for (const p of particles) {
    if (!p.alive || p.bound) continue
    p.vx += (Math.random() - 0.5) * jitter
    p.vy += (Math.random() - 0.5) * jitter
  }
}

// Calculate dissolution percentage
// Measures how dispersed solute particles are from their initial cluster center
export function calcDissolutionPercent(particles, soluteTypes, clusterCenter, canvasWidth) {
  const soluteParticles = particles.filter(p => p.alive && soluteTypes.includes(p.type))
  if (soluteParticles.length === 0) return 100

  // A particle is "dissolved" if it's far from the cluster center
  // Threshold: 30% of canvas width from cluster center
  const threshold = canvasWidth * 0.3
  let dissolved = 0

  for (const p of soluteParticles) {
    const dx = p.x - clusterCenter.x
    const dy = p.y - clusterCenter.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist > threshold) dissolved++
  }

  return Math.round((dissolved / soluteParticles.length) * 100)
}

// Lattice-aware dissolution: % of ions that have been freed from the bound crystal state
// Use this for scenarios with latticeConfig.bound (e.g. NaCl) where dissolution = ion release
// Counts p.dissolved (one-way "has ever been hydrated enough to break free") rather than
// the current bound state, so the % doesn't flicker as hydration shells fluctuate.
export function calcLatticeDissolutionPercent(particles, soluteTypes) {
  const ions = particles.filter(p => p.alive && soluteTypes.includes(p.type))
  if (ions.length === 0) return 100
  const freed = ions.filter(p => p.dissolved).length
  return Math.round((freed / ions.length) * 100)
}

// Calculate separation percentage (for immiscible scenarios like oil-water)
// Measures how separated the two groups are vertically
export function calcSeparationPercent(particles, typeA, typeB) {
  const groupA = particles.filter(p => p.alive && p.type === typeA)
  const groupB = particles.filter(p => p.alive && p.type === typeB)
  if (groupA.length === 0 || groupB.length === 0) return 0

  const avgYA = groupA.reduce((sum, p) => sum + p.y, 0) / groupA.length
  const avgYB = groupB.reduce((sum, p) => sum + p.y, 0) / groupB.length

  // How different are their average Y positions? Normalize to 0-100
  const separation = Math.abs(avgYA - avgYB)
  // Max meaningful separation is about half the canvas height
  return Math.min(100, Math.round((separation / 200) * 100))
}
