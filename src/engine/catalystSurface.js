// CatalystSurface - Heterogeneous catalyst surface for the Haber process
// Manages particle adsorption, surface reactions, and desorption

const BARRIER_HEIGHT = 30          // Logical pixels tall
const BINDING_PROXIMITY = 250      // Max x-distance between bound particles for reaction
const MAX_BOUND = 24               // Surface saturation limit
const BIND_PROBABILITY = 0.8       // Chance of binding on surface contact
const FORWARD_REACTION_PROB = 0.25 // Per-frame chance when valid group exists
const REVERSE_REACTION_PROB = 0.08 // Per-frame chance for reverse surface reaction
const DRIFT_SPEED = 0.4            // Surface diffusion — bound particles drift toward neighbors

export class CatalystSurface {
  constructor(canvasWidth, canvasHeight, active = false) {
    this.canvasWidth = canvasWidth
    this.canvasHeight = canvasHeight
    this.y = canvasHeight - BARRIER_HEIGHT  // Top edge of barrier
    this.height = BARRIER_HEIGHT
    this.active = active
    this.boundParticles = []
  }

  /**
   * Try to bind a free particle that has contacted the surface.
   * Only binds N2, H2, or NH3 particles.
   * Returns true if binding occurred.
   */
  tryBind(particle) {
    if (!this.active) return false
    if (particle.bound) return false
    if (particle.reacting) return false  // Cooldown — freshly formed particles can't re-bind
    if (this.boundParticles.length >= MAX_BOUND) return false

    // Only bind reactant/product types
    const bindableTypes = ['N2', 'H2', 'NH3']
    if (!bindableTypes.includes(particle.type)) return false

    // Check if particle is near the surface (within 30px of the barrier top)
    const distToSurface = this.y - (particle.y + particle.radius)
    if (distToSurface > 30 || distToSurface < -5) return false

    // Random binding chance
    if (Math.random() > BIND_PROBABILITY) return false

    // Bind the particle
    particle.bound = true
    particle.y = this.y - particle.radius
    particle.vx = 0
    particle.vy = 0
    this.boundParticles.push(particle)
    return true
  }

  /**
   * Check if a forward surface reaction can occur:
   * 1 bound N2 + 3 bound H2 within proximity → reaction
   * Returns { n2, h2s: [h1, h2, h3] } or null
   */
  checkForwardReaction(eqModifier = 0.5) {
    if (!this.active) return null

    const boundN2 = this.boundParticles.filter(p => p.alive && p.type === 'N2')
    const boundH2 = this.boundParticles.filter(p => p.alive && p.type === 'H2')

    if (boundN2.length < 1 || boundH2.length < 3) return null

    for (const n2 of boundN2) {
      // Find H2 particles within proximity
      const nearbyH2 = boundH2.filter(h =>
        Math.abs(h.x - n2.x) < BINDING_PROXIMITY
      )

      if (nearbyH2.length >= 3) {
        // Adjust probability based on equilibrium modifier
        // Higher eqModifier = more forward favored = higher probability
        const adjustedProb = FORWARD_REACTION_PROB * (0.5 + eqModifier)
        if (Math.random() > adjustedProb) continue

        return {
          n2,
          h2s: nearbyH2.slice(0, 3),
        }
      }
    }

    return null
  }

  /**
   * Check if a reverse surface reaction can occur:
   * 2 bound NH3 within proximity → decompose
   * Returns { nh3s: [nh3a, nh3b] } or null
   */
  checkReverseReaction(eqModifier = 0.5) {
    if (!this.active) return null

    const boundNH3 = this.boundParticles.filter(p => p.alive && p.type === 'NH3')
    if (boundNH3.length < 2) return null

    for (let i = 0; i < boundNH3.length; i++) {
      for (let j = i + 1; j < boundNH3.length; j++) {
        if (Math.abs(boundNH3[i].x - boundNH3[j].x) < BINDING_PROXIMITY) {
          // Higher eqModifier = forward favored = less likely to reverse
          const adjustedProb = REVERSE_REACTION_PROB * (1.5 - eqModifier)
          if (Math.random() > adjustedProb) continue

          return {
            nh3s: [boundNH3[i], boundNH3[j]],
          }
        }
      }
    }

    return null
  }

  /**
   * Surface diffusion — bound particles drift toward nearby complementary particles.
   * N2 drifts toward H2 and vice versa, helping them cluster for reactions.
   */
  diffuse() {
    if (!this.active) return
    for (const p of this.boundParticles) {
      if (!p.alive) continue
      // Find nearest complementary particle
      let targetX = null
      let minDist = Infinity
      const complementary = p.type === 'N2' ? 'H2' : (p.type === 'H2' ? 'N2' : null)
      if (!complementary) continue

      for (const other of this.boundParticles) {
        if (!other.alive || other === p) continue
        if (other.type === complementary) {
          const dist = Math.abs(other.x - p.x)
          if (dist < minDist) {
            minDist = dist
            targetX = other.x
          }
        }
      }

      if (targetX !== null && minDist > 10) {
        // Drift toward nearest complementary particle
        p.x += Math.sign(targetX - p.x) * DRIFT_SPEED
      }
    }
  }

  /**
   * Unbind a specific particle from the surface.
   */
  unbind(particle) {
    particle.bound = false
    this.boundParticles = this.boundParticles.filter(p => p !== particle)
  }

  /**
   * Release all bound particles (e.g., when catalyst is toggled off).
   * Gives them random upward velocities.
   */
  releaseAll(targetSpeed = 60) {
    for (const p of this.boundParticles) {
      p.bound = false
      p.vx = (Math.random() - 0.5) * targetSpeed * 0.5
      p.vy = -Math.abs(Math.random() * targetSpeed * 0.5)  // Launch upward
    }
    this.boundParticles = []
  }

  /**
   * Clean dead particles from the bound list.
   */
  cleanDead() {
    this.boundParticles = this.boundParticles.filter(p => p.alive)
  }

  /**
   * Get the effective floor y-coordinate for free particles to bounce off.
   */
  getEffectiveFloor() {
    return this.active ? this.y : this.canvasHeight
  }
}
