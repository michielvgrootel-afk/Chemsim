// Particle class - represents a single particle in the simulation

let nextId = 0

export class Particle {
  constructor({ type, x, y, radius = 12, color = '#fff', label = '', mass = 1 }) {
    this.id = nextId++
    this.type = type
    this.x = x
    this.y = y
    this.radius = radius
    this.color = color
    this.label = label
    this.mass = mass

    // Physics
    this.vx = 0
    this.vy = 0

    // State
    this.alive = true
    this.reacting = false
    this.reactTimer = 0
    this.opacity = 1
    this.bound = false  // Whether adsorbed to catalyst surface

    // Grid cell (updated each frame by spatial grid)
    this.cellX = 0
    this.cellY = 0
  }

  setRandomVelocity(speed) {
    const angle = Math.random() * Math.PI * 2
    this.vx = Math.cos(angle) * speed
    this.vy = Math.sin(angle) * speed
  }

  update(dt, canvasWidth, canvasHeight, effectiveFloor) {
    if (!this.alive) return

    // Bound particles only drift slightly along x
    if (this.bound) {
      this.x += (Math.random() - 0.5) * 0.3
      // Clamp to canvas bounds
      if (this.x - this.radius < 0) this.x = this.radius
      if (this.x + this.radius > canvasWidth) this.x = canvasWidth - this.radius
      // Handle reaction animation even when bound
      if (this.reacting) {
        this.reactTimer -= dt
        if (this.reactTimer <= 0) this.reacting = false
      }
      return
    }

    this.x += this.vx * dt
    this.y += this.vy * dt

    const floor = effectiveFloor || canvasHeight

    // Bounce off walls
    if (this.x - this.radius < 0) {
      this.x = this.radius
      this.vx = Math.abs(this.vx)
    }
    if (this.x + this.radius > canvasWidth) {
      this.x = canvasWidth - this.radius
      this.vx = -Math.abs(this.vx)
    }
    if (this.y - this.radius < 0) {
      this.y = this.radius
      this.vy = Math.abs(this.vy)
    }
    if (this.y + this.radius > floor) {
      this.y = floor - this.radius
      this.vy = -Math.abs(this.vy)
    }

    // Handle reaction animation
    if (this.reacting) {
      this.reactTimer -= dt
      if (this.reactTimer <= 0) {
        this.reacting = false
      }
    }
  }

  speed() {
    return Math.sqrt(this.vx * this.vx + this.vy * this.vy)
  }

  kineticEnergy() {
    const s = this.speed()
    return 0.5 * this.mass * s * s
  }

  distanceTo(other) {
    const dx = this.x - other.x
    const dy = this.y - other.y
    return Math.sqrt(dx * dx + dy * dy)
  }
}

export function resetParticleIds() {
  nextId = 0
}
