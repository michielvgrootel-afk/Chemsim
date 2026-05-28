// Emulsifier dynamics — amphipathic molecules that bond oil and water
// together to form persistent micelle-like clusters.
//
// Each emulsifier has:
//   - A polar "head" end that wants water (head bonds)
//   - A nonpolar "tail" end that wants oil (tail bonds)
//   - Up to maxOilPerEmul oil partners and maxWaterPerEmul water partners
//
// Once bonded, the partners feel a spring force toward the emulsifier
// (toward an "ideal" distance) — strong enough to survive stirring,
// gentle enough not to override collision physics. The emulsifier
// rotates so its tail points at the centroid of its bonded oils,
// giving a clear visual cue (oil at tail, water at head).
//
// Partners track `bondedEmulId` so multiple emulsifiers don't fight
// over the same oil/water particle.

export function spawnEmulsifiers(particles, createParticle, pType, count, width, height, speed) {
  if (!pType) return
  for (let i = 0; i < count; i++) {
    const p = createParticle(
      pType,
      Math.random() * (width - 60) + 30,
      Math.random() * (height - 60) + 30,
    )
    p.setRandomVelocity(speed)
    p.angle = Math.random() * Math.PI * 2
    p.bondedOilIds = []
    p.bondedWaterIds = []
    particles.push(p)
  }
}

export function despawnEmulsifiers(particles) {
  for (const p of particles) {
    if (!p.alive) continue
    if (p.type === 'EMUL') {
      // Unbind any partners so they're free again
      for (const oilId of p.bondedOilIds || []) {
        const oil = particles.find(o => o.id === oilId)
        if (oil) oil.bondedEmulId = null
      }
      for (const wId of p.bondedWaterIds || []) {
        const w = particles.find(o => o.id === wId)
        if (w) w.bondedEmulId = null
      }
      p.alive = false
      p.bondedOilIds = []
      p.bondedWaterIds = []
    }
  }
}

// Per-frame update: find new bonds, apply spring forces, set rotation.
// Called every tick when there are live emulsifiers in the simulation.
export function updateEmulsifierBonds(particles, grid, dt, config = {}) {
  const bondRange = config.bondRange || 60
  const bondRangeSq = bondRange * bondRange
  const breakRange = (config.bondRange || 60) * 2.2
  const breakRangeSq = breakRange * breakRange
  const idealDist = config.bondDistance || 26
  const springK = config.springK || 6
  const maxOil = config.maxOilPerEmul ?? 2
  const maxWater = config.maxWaterPerEmul ?? 2

  // First pass: break stale bonds (partner moved out of breakRange)
  for (const e of particles) {
    if (!e.alive || e.type !== 'EMUL') continue

    if (e.bondedOilIds && e.bondedOilIds.length) {
      e.bondedOilIds = e.bondedOilIds.filter(oilId => {
        const oil = particles.find(o => o.id === oilId)
        if (!oil || !oil.alive) return false
        const dx = oil.x - e.x, dy = oil.y - e.y
        if (dx * dx + dy * dy > breakRangeSq) {
          oil.bondedEmulId = null
          return false
        }
        return true
      })
    }
    if (e.bondedWaterIds && e.bondedWaterIds.length) {
      e.bondedWaterIds = e.bondedWaterIds.filter(wId => {
        const w = particles.find(o => o.id === wId)
        if (!w || !w.alive) return false
        const dx = w.x - e.x, dy = w.y - e.y
        if (dx * dx + dy * dy > breakRangeSq) {
          w.bondedEmulId = null
          return false
        }
        return true
      })
    }
  }

  // Second pass: form new bonds and apply spring forces
  for (const e of particles) {
    if (!e.alive || e.type !== 'EMUL') continue
    e.bondedOilIds = e.bondedOilIds || []
    e.bondedWaterIds = e.bondedWaterIds || []

    // Find new bonds if we have open slots
    if (e.bondedOilIds.length < maxOil || e.bondedWaterIds.length < maxWater) {
      const nearby = grid.getNearby(e)
      // Sort by distance
      const candidates = []
      for (const o of nearby) {
        if (!o.alive || o === e) continue
        if (o.bondedEmulId != null) continue
        if (o.type !== 'OIL' && o.type !== 'H2O') continue
        const dx = o.x - e.x, dy = o.y - e.y
        const dsq = dx * dx + dy * dy
        if (dsq < bondRangeSq) candidates.push({ p: o, dsq })
      }
      candidates.sort((a, b) => a.dsq - b.dsq)
      for (const c of candidates) {
        if (c.p.type === 'OIL' && e.bondedOilIds.length < maxOil) {
          c.p.bondedEmulId = e.id
          e.bondedOilIds.push(c.p.id)
        } else if (c.p.type === 'H2O' && e.bondedWaterIds.length < maxWater) {
          c.p.bondedEmulId = e.id
          e.bondedWaterIds.push(c.p.id)
        }
        if (e.bondedOilIds.length >= maxOil && e.bondedWaterIds.length >= maxWater) break
      }
    }

    // Compute orientation from bonded oil(s) — tail points toward oil centroid
    if (e.bondedOilIds.length > 0) {
      let ox = 0, oy = 0, n = 0
      for (const oilId of e.bondedOilIds) {
        const oil = particles.find(o => o.id === oilId)
        if (oil) { ox += oil.x; oy += oil.y; n++ }
      }
      if (n > 0) {
        ox /= n; oy /= n
        e.angle = Math.atan2(oy - e.y, ox - e.x)
      }
    } else {
      // Idle slow rotation when unbonded
      e.angle = (e.angle || 0) + dt * 0.4
    }

    // Apply spring forces toward the ideal bond distance
    const allPartners = [
      ...e.bondedOilIds.map(id => particles.find(p => p.id === id)),
      ...e.bondedWaterIds.map(id => particles.find(p => p.id === id)),
    ].filter(Boolean)

    for (const partner of allPartners) {
      const dx = partner.x - e.x
      const dy = partner.y - e.y
      const dist = Math.sqrt(dx * dx + dy * dy) || 1
      const nx = dx / dist, ny = dy / dist
      // Spring: F = -k * (dist - idealDist), positive when too far → pulls together
      const stretch = dist - idealDist
      const f = springK * stretch * dt
      // Apply equal-and-opposite to emulsifier and partner (mass-weighted)
      const totalMass = (e.mass || 1) + (partner.mass || 1)
      const eShare = (partner.mass || 1) / totalMass
      const pShare = (e.mass || 1) / totalMass
      e.vx += f * nx * eShare * 60
      e.vy += f * ny * eShare * 60
      partner.vx -= f * nx * pShare * 60
      partner.vy -= f * ny * pShare * 60
    }
  }
}
