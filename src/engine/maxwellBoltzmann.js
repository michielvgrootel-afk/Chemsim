// Maxwell–Boltzmann lab: how the kinetic energies of gas particles are
// spread out. Pure functions and plain data, no React.
// Energies in kJ mol⁻¹, temperatures in K. The particles are drawn in a flat
// box, but their energies are those of particles moving in 3D (the textbook
// curve): E / RT follows a gamma distribution with shape 3/2.

export const R = 8.314e-3   // kJ mol⁻¹ K⁻¹

// Fraction of particles per kJ mol⁻¹ with kinetic energy E
export function density(E, T) {
  if (E <= 0) return 0
  const kT = R * T
  return 2 * Math.sqrt(E / Math.PI) * Math.pow(kT, -1.5) * Math.exp(-E / kT)
}

// Fraction of particles with at least energy Ea: the area under the curve
// to the right of Ea
export function fractionAbove(Ea, T) {
  if (Ea <= 0) return 1
  const x = Ea / (R * T)
  return erfc(Math.sqrt(x)) + 2 * Math.sqrt(x / Math.PI) * Math.exp(-x)
}

export const mostProbableEnergy = (T) => (R * T) / 2   // the peak of the curve
export const meanEnergy = (T) => 1.5 * R * T

// Complementary error function (Abramowitz & Stegun 7.1.26, error < 1.5 × 10⁻⁷)
export function erfc(x) {
  const t = 1 / (1 + 0.3275911 * Math.abs(x))
  const y = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429)))) * Math.exp(-x * x)
  return x >= 0 ? y : 2 - y
}

// Standard normal random number (Box–Muller)
export function gauss() {
  const u = 1 - Math.random()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random())
}

// Kinetic energy / RT of one particle: half the sum of its three squared
// velocity components
function energyOverRT() {
  const x = gauss()
  const y = gauss()
  const z = gauss()
  return (x * x + y * y + z * z) / 2
}

// ---------- A sample of particles ----------

export function createSample(n, T, width, height, radius) {
  const cols = Math.ceil(Math.sqrt((n * width) / height))
  const rows = Math.ceil(n / cols)
  const particles = []
  for (let i = 0; i < n; i++) {
    const a = Math.random() * 2 * Math.PI
    particles.push({
      x: ((i % cols) + 0.5 + (Math.random() - 0.5) * 0.4) * (width / cols),
      y: (Math.floor(i / cols) + 0.5 + (Math.random() - 0.5) * 0.4) * (height / rows),
      dx: Math.cos(a),
      dy: Math.sin(a),
      E: R * T * energyOverRT(),
    })
  }
  return { particles, T, width, height, radius, time: 0, flashes: [], successes: [], dots: [] }
}

// Heating or cooling scales every particle's energy: the curve stretches or
// squeezes but keeps its shape
export function setSampleTemperature(sample, T) {
  if (T === sample.T) return
  const k = T / sample.T
  for (const p of sample.particles) p.E *= k
  sample.T = T
}

// Move the particles for dt seconds (speed = speedScale × √E px/s) and let
// them collide. A collision shares the pair's total energy out again at
// random, in the proportions it would be in a real gas: energy is
// conserved, single particles keep changing energy, the spread stays.
// Returns the collisions with each particle's energy just before.
export function stepSample(sample, dt, speedScale) {
  const { particles, width, height, radius } = sample
  for (const p of particles) {
    const v = speedScale * Math.sqrt(p.E)
    p.x += p.dx * v * dt
    p.y += p.dy * v * dt
    if (p.x < radius) { p.x = radius; p.dx = Math.abs(p.dx) }
    if (p.x > width - radius) { p.x = width - radius; p.dx = -Math.abs(p.dx) }
    if (p.y < radius) { p.y = radius; p.dy = Math.abs(p.dy) }
    if (p.y > height - radius) { p.y = height - radius; p.dy = -Math.abs(p.dy) }
  }

  const hits = []
  const d0 = 2 * radius
  for (let i = 0; i < particles.length; i++) {
    const a = particles[i]
    for (let j = i + 1; j < particles.length; j++) {
      const b = particles[j]
      const x = b.x - a.x
      const y = b.y - a.y
      const d2 = x * x + y * y
      if (d2 >= d0 * d0 || d2 === 0) continue
      const d = Math.sqrt(d2)
      const nx = x / d
      const ny = y / d
      const va = speedScale * Math.sqrt(a.E)
      const vb = speedScale * Math.sqrt(b.E)
      const an = (a.dx * nx + a.dy * ny) * va
      const bn = (b.dx * nx + b.dy * ny) * vb
      if (an - bn <= 0) continue   // already moving apart
      hits.push({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, e1: a.E, e2: b.E, i, j })
      // Bounce: swap the velocity parts along the line between them
      turn(a, a.dx * va + (bn - an) * nx, a.dy * va + (bn - an) * ny)
      turn(b, b.dx * vb + (an - bn) * nx, b.dy * vb + (an - bn) * ny)
      // Share the energy out again
      const total = a.E + b.E
      const ea = energyOverRT()
      const eb = energyOverRT()
      a.E = (total * ea) / (ea + eb)
      b.E = total - a.E
      // Separate them so they don't stick
      const push = (d0 - d) / 2
      a.x -= nx * push
      a.y -= ny * push
      b.x += nx * push
      b.y += ny * push
    }
  }
  return hits
}

function turn(p, vx, vy) {
  const s = Math.hypot(vx, vy)
  if (s > 1e-9) {
    p.dx = vx / s
    p.dy = vy / s
  }
}
