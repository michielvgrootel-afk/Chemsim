// Acid-base helpers — pH calculation, indicator colour updates,
// and burst-spawn queue draining.
//
// These are pure (no React, no module imports beyond the engine) so they
// can be unit-tested or swapped in isolation.

// ---------- pH calculation ----------
// Real pH = -log10([H+]) is meaningless in a particle world without
// absolute concentration. Use a normalised log-ratio that maps the
// (H+ count) vs (OH- count) balance onto a familiar 0-14 scale.
//
//   pH = neutralPH + scale * log10((OH + 0.5) / (H + 0.5))
//
// The +0.5 smoothing prevents log(0) singularities (very common in
// fresh sims that haven't generated their first OH- yet).
// `scale` controls how "swingy" pH is per ratio change; default 2.5 makes
// realistic particle ratios (~10:1) map to memorable pH values (~4 / 10).
export function calcPH(particles, phConfig = {}) {
  const neutralPH = phConfig.neutralPH ?? 7
  const scale = phConfig.scale ?? 2.5
  let h = 0
  let oh = 0
  for (const p of particles) {
    if (!p.alive) continue
    if (p.type === 'H') h++
    else if (p.type === 'OH') oh++
  }
  if (h === 0 && oh === 0) return neutralPH
  const ratio = (oh + 0.5) / (h + 0.5)
  const ph = neutralPH + scale * Math.log10(ratio)
  return Math.max(0, Math.min(14, ph))
}

// ---------- Indicator colour update ----------
// Walks indicator particles and repaints them based on the global pH.
// `thresholds` is an array sorted high->low by `minPH`, each entry
// providing the colour + label for that band. We mutate p.color / p.label
// only when they actually change so the sprite cache key only flips on
// real transitions.
export function updateIndicators(particles, ph, indicatorConfig) {
  if (!indicatorConfig) return
  const indicatorType = indicatorConfig.type
  const thresholds = indicatorConfig.thresholds || []
  if (!indicatorType || thresholds.length === 0) return

  // Pick the band whose minPH the current pH satisfies. Thresholds are
  // expected sorted high->low; iterate and pick first match. Fall back
  // to the last band (most-acidic) if none match.
  let band = thresholds[thresholds.length - 1]
  for (const t of thresholds) {
    if (ph >= t.minPH) { band = t; break }
  }

  for (const p of particles) {
    if (!p.alive || p.type !== indicatorType) continue
    if (p.color !== band.color) p.color = band.color
    if (band.label !== undefined && p.label !== band.label) p.label = band.label
  }
}

// ---------- Burst-spawn queue ----------
// Drains a queue of spawn requests injected via "Add drop" buttons.
// Each request is `{ type, count, region, spread, speed }`.
// Region is 'top' | 'bottom' | 'random' (default 'random').
// For each particle we make up to 5 attempts to find a position that
// doesn't overlap an existing particle of similar size; if all attempts
// fail we accept the last candidate and let the collision resolver sort it.
export function processPendingSpawns(pendingRef, particles, createParticle, rxn, dims, targetSpeed) {
  if (!pendingRef.current || pendingRef.current.length === 0) return
  const queue = pendingRef.current
  pendingRef.current = []

  const { width, height } = dims

  for (const spec of queue) {
    if (!spec || !spec.type) continue
    const pType = rxn.particleTypes.find(pt => pt.type === spec.type)
    if (!pType) continue
    const count = Math.max(1, spec.count || 1)
    const speed = spec.speed || targetSpeed || 60
    const region = spec.region || 'random'
    const spread = spec.spread ?? 80

    // Cluster centre — where the "drop" lands
    let cx, cy
    if (region === 'top') {
      cx = width / 2 + (Math.random() - 0.5) * spread
      cy = 30 + Math.random() * 30
    } else if (region === 'bottom') {
      cx = width / 2 + (Math.random() - 0.5) * spread
      cy = height - 50 - Math.random() * 30
    } else {
      cx = 50 + Math.random() * (width - 100)
      cy = 50 + Math.random() * (height - 100)
    }

    const minDistSq = (pType.radius || 12) * 2 * (pType.radius || 12) * 2

    for (let i = 0; i < count; i++) {
      let x = cx, y = cy
      let okPos = false
      for (let attempt = 0; attempt < 5; attempt++) {
        const dx = (Math.random() - 0.5) * spread
        const dy = (Math.random() - 0.5) * Math.min(40, spread)
        x = Math.max(20, Math.min(width - 20, cx + dx))
        y = Math.max(20, Math.min(height - 20, cy + dy))
        // Probe: any nearby particle within minDist?
        let overlaps = false
        for (const o of particles) {
          if (!o.alive) continue
          const ddx = o.x - x, ddy = o.y - y
          if (ddx * ddx + ddy * ddy < minDistSq) { overlaps = true; break }
        }
        if (!overlaps) { okPos = true; break }
      }
      // Even if not okPos after 5 tries, spawn anyway — collision
      // resolver will push it out within a frame or two.
      const p = createParticle(pType, x, y)
      p.setRandomVelocity(speed)
      // Top drops get a downward bias so they look like a falling drop
      if (region === 'top') p.vy = Math.abs(p.vy) + speed * 0.3
      particles.push(p)
    }
  }
}
