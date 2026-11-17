// Drawing for the Maxwell–Boltzmann lab: the box of particles and the
// energy graph in which every particle is one dot. Both canvases use fixed
// logical sizes and scale to fit their column.
import { density, mostProbableEnergy, meanEnergy } from '../../engine/maxwellBoltzmann'

export const BOX = { w: 900, h: 240, r: 6 }
export const GRAPH = { w: 900, h: 330, left: 58, right: 18, top: 24, bottom: 48 }
export const SPEED = 32   // px/s per √(kJ mol⁻¹)
export const FLASH_TIME = 0.25   // s a ring shows after a collision with enough energy

// Colour and shape per energy group (shapes as well as colours, for
// colour-blind students)
export const GROUPS = {
  low: { color: '#4f9cf0', label: 'not enough energy to react' },
  cat: { color: '#4fd1c5', label: 'enough energy only with the catalyst' },
  high: { color: '#f0913a', label: 'enough energy to react (E ≥ Ea)' },
}
const SELECT = '#ffffff'
const FLASH = '255, 214, 120'
const CURVE = '#e8eaf0'
const REFERENCE = '#8a95a8'

export function groupOf(E, Ea, EaCat) {
  if (E >= Ea) return 'high'
  if (EaCat != null && E >= EaCat) return 'cat'
  return 'low'
}

function shape(ctx, group, x, y, r) {
  ctx.beginPath()
  if (group === 'high') {
    const s = r * 1.35
    ctx.moveTo(x, y - s)
    ctx.lineTo(x + s, y)
    ctx.lineTo(x, y + s)
    ctx.lineTo(x - s, y)
    ctx.closePath()
  } else if (group === 'cat') {
    const s = r * 1.3
    ctx.moveTo(x, y - s)
    ctx.lineTo(x + s * 0.95, y + s * 0.7)
    ctx.lineTo(x - s * 0.95, y + s * 0.7)
    ctx.closePath()
  } else {
    ctx.arc(x, y, r, 0, Math.PI * 2)
  }
  ctx.fill()
}

function outlinedText(ctx, text, x, y, color) {
  ctx.setLineDash([])
  ctx.lineWidth = 3
  ctx.strokeStyle = '#1a1d24'
  ctx.strokeText(text, x, y)
  ctx.fillStyle = color
  ctx.fillText(text, x, y)
}

// ---------- The box ----------

export function drawBox(ctx, sample, { Ea, EaCat, selected }) {
  ctx.save()
  ctx.fillStyle = '#1a1d24'
  ctx.fillRect(0, 0, BOX.w, BOX.h)

  // A short trail behind each particle: the longer, the faster
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  ctx.globalAlpha = 0.25
  for (const p of sample.particles) {
    const tail = SPEED * Math.sqrt(p.E) * 0.12
    ctx.strokeStyle = GROUPS[groupOf(p.E, Ea, EaCat)].color
    ctx.beginPath()
    ctx.moveTo(p.x - p.dx * tail, p.y - p.dy * tail)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
  for (const p of sample.particles) {
    const group = groupOf(p.E, Ea, EaCat)
    ctx.fillStyle = GROUPS[group].color
    shape(ctx, group, p.x, p.y, BOX.r)
  }

  // Collisions with enough energy to react
  ctx.lineWidth = 1.5
  for (const f of sample.flashes) {
    ctx.strokeStyle = `rgba(${FLASH}, ${(0.9 * (1 - f.age / FLASH_TIME)).toFixed(3)})`
    ctx.beginPath()
    ctx.arc(f.x, f.y, 7 + 45 * f.age, 0, Math.PI * 2)
    ctx.stroke()
  }

  if (selected != null && sample.particles[selected]) {
    const p = sample.particles[selected]
    ctx.strokeStyle = SELECT
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(p.x, p.y, BOX.r + 6, 0, Math.PI * 2)
    ctx.stroke()
    ctx.font = 'bold 13px Inter, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const y = p.y < 30 ? p.y + 24 : p.y - 22
    const x = Math.max(60, Math.min(BOX.w - 60, p.x))
    outlinedText(ctx, `${p.E.toFixed(1)} kJ mol⁻¹`, x, y, SELECT)
  }
  ctx.restore()
}

export function hitBox(sample, x, y) {
  let best = null
  let bestD = 18
  sample.particles.forEach((p, i) => {
    const d = Math.hypot(p.x - x, p.y - y)
    if (d < bestD) {
      best = i
      bestD = d
    }
  })
  return best
}

// ---------- The graph ----------

export function graphLayout(cfg) {
  const W = GRAPH.w - GRAPH.left - GRAPH.right
  const H = GRAPH.h - GRAPH.top - GRAPH.bottom
  const bins = Math.round(cfg.maxEnergy / cfg.binWidth)
  const rowH = H / cfg.maxCount
  return {
    W,
    H,
    bins,
    rowH,
    dotR: Math.max(2, Math.min(W / bins, rowH) / 2 - 0.6),
    x: (E) => GRAPH.left + (E / cfg.maxEnergy) * W,
    y: (count) => GRAPH.top + H - count * rowH,
  }
}

// Every particle is one dot, stacked in the column for its energy; the
// curve is what the same graph looks like for a huge number of particles
// (scaled to this sample, so it follows the tops of the columns)
export function drawGraph(ctx, sample, { cfg, T, Ea, EaCat, reference, show, selected }) {
  const L = graphLayout(cfg)
  const N = sample.particles.length
  const curveAt = (E, temp) => N * cfg.binWidth * density(E, temp)
  const left = GRAPH.left
  const right = GRAPH.left + L.W
  const bottom = L.y(0)

  ctx.save()
  ctx.fillStyle = '#1a1d24'
  ctx.fillRect(0, 0, GRAPH.w, GRAPH.h)

  // Grid and axes
  ctx.font = '11px Inter, sans-serif'
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'right'
  ctx.lineWidth = 1
  for (let c = 0; c <= cfg.maxCount; c += 10) {
    const y = L.y(c)
    ctx.strokeStyle = c === 0 ? '#6b7585' : '#2a2f3a'
    ctx.beginPath()
    ctx.moveTo(left, y)
    ctx.lineTo(right, y)
    ctx.stroke()
    ctx.fillStyle = '#8a95a8'
    ctx.fillText(String(c), left - 8, y)
  }
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  for (let E = 0; E <= cfg.maxEnergy; E += 5) {
    const x = L.x(E)
    ctx.strokeStyle = '#6b7585'
    ctx.beginPath()
    ctx.moveTo(x, bottom)
    ctx.lineTo(x, bottom + 5)
    ctx.stroke()
    ctx.fillStyle = '#8a95a8'
    ctx.fillText(String(E), x, bottom + 8)
  }
  ctx.strokeStyle = '#6b7585'
  ctx.beginPath()
  ctx.moveTo(left, GRAPH.top - 6)
  ctx.lineTo(left, bottom)
  ctx.stroke()
  ctx.font = '12px Inter, sans-serif'
  ctx.fillText('Kinetic energy (kJ mol⁻¹)', left + L.W / 2, bottom + 26)
  ctx.save()
  ctx.translate(16, GRAPH.top + L.H / 2)
  ctx.rotate(-Math.PI / 2)
  ctx.textBaseline = 'middle'
  ctx.fillText('Number of particles', 0, 0)
  ctx.restore()

  const curvePath = (temp, from = 0, to = cfg.maxEnergy, closed = false) => {
    ctx.beginPath()
    if (closed) ctx.moveTo(L.x(from), bottom)
    for (let E = from; E <= to + 1e-9; E += 0.1) {
      const y = Math.max(GRAPH.top - 6, L.y(curveAt(E, temp)))
      if (!closed && E === from) ctx.moveTo(L.x(E), y)
      else ctx.lineTo(L.x(E), y)
    }
    if (closed) {
      ctx.lineTo(L.x(to), bottom)
      ctx.closePath()
    }
  }

  // Area under the curve beyond Ea: the particles with enough energy
  if (show.curve && show.area) {
    if (EaCat != null && EaCat < Ea) {
      curvePath(T, EaCat, Math.min(Ea, cfg.maxEnergy), true)
      ctx.fillStyle = 'rgba(79, 209, 197, 0.2)'
      ctx.fill()
    }
    if (Ea < cfg.maxEnergy) {
      curvePath(T, Ea, cfg.maxEnergy, true)
      ctx.fillStyle = 'rgba(240, 145, 58, 0.22)'
      ctx.fill()
    }
  }

  // A kept curve to compare with
  if (reference != null) {
    ctx.setLineDash([6, 5])
    ctx.strokeStyle = REFERENCE
    ctx.lineWidth = 2
    curvePath(reference)
    ctx.stroke()
    ctx.setLineDash([])
    const peak = mostProbableEnergy(reference)
    ctx.font = 'bold 12px Inter, sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'bottom'
    outlinedText(ctx, `${reference} K`, L.x(peak) + 10, L.y(curveAt(peak, reference)) - 4, REFERENCE)
  }

  // The particles
  const counts = new Array(L.bins).fill(0)
  let offScale = 0
  sample.dots = sample.particles.map((p, i) => {
    const bin = Math.floor(p.E / cfg.binWidth)
    if (bin >= L.bins) {
      offScale++
      return null
    }
    const k = counts[bin]++
    if (k >= cfg.maxCount) return null
    const dot = { x: L.x((bin + 0.5) * cfg.binWidth), y: L.y(k + 0.5) }
    const group = groupOf(p.E, Ea, EaCat)
    ctx.fillStyle = GROUPS[group].color
    shape(ctx, group, dot.x, dot.y, L.dotR)
    return dot
  })

  if (show.curve) {
    ctx.strokeStyle = CURVE
    ctx.lineWidth = 2.5
    curvePath(T)
    ctx.stroke()
  }

  // Most probable and mean energy
  if (show.markers) {
    ctx.font = '11px Inter, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'bottom'
    for (const [E, text, dy] of [[mostProbableEnergy(T), 'most probable', 0], [meanEnergy(T), 'mean', 16]]) {
      if (E > cfg.maxEnergy) continue
      const top = L.y(curveAt(E, T))
      ctx.setLineDash([2, 4])
      ctx.strokeStyle = '#c8cdd8'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(L.x(E), bottom)
      ctx.lineTo(L.x(E), top)
      ctx.stroke()
      outlinedText(ctx, `${text} ${E.toFixed(1)}`, L.x(E), top - 6 - dy, '#c8cdd8')
    }
    ctx.setLineDash([])
  }

  // Activation energy lines
  const eaLine = (E, color, text, y) => {
    if (E > cfg.maxEnergy) return
    ctx.setLineDash([6, 4])
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(L.x(E), GRAPH.top - 6)
    ctx.lineTo(L.x(E), bottom)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.font = 'bold 12px Inter, sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    outlinedText(ctx, text, L.x(E) + 6, y, color)
  }
  eaLine(Ea, GROUPS.high.color, 'Ea', GRAPH.top + 4)
  if (EaCat != null) eaLine(EaCat, GROUPS.cat.color, 'Ea with catalyst', GRAPH.top + 22)

  if (offScale > 0) {
    ctx.font = '11px Inter, sans-serif'
    ctx.textAlign = 'right'
    ctx.textBaseline = 'bottom'
    outlinedText(ctx, `+${offScale} beyond ${cfg.maxEnergy} →`, right, bottom - 4, '#c8cdd8')
  }

  // The particle being followed
  const dot = selected != null ? sample.dots[selected] : null
  if (dot) {
    ctx.strokeStyle = SELECT
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(dot.x, dot.y, L.dotR + 4, 0, Math.PI * 2)
    ctx.stroke()
    const column = counts[Math.floor(sample.particles[selected].E / cfg.binWidth)] || 0
    const labelY = Math.max(GRAPH.top + 40, L.y(Math.min(column, cfg.maxCount)) - 14)
    ctx.font = 'bold 12px Inter, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'bottom'
    outlinedText(ctx, 'this particle', Math.max(left + 40, Math.min(right - 40, dot.x)), labelY, SELECT)
    ctx.strokeStyle = SELECT
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(dot.x, labelY + 2)
    ctx.lineTo(dot.x, dot.y - L.dotR - 5)
    ctx.stroke()
  }
  ctx.restore()
}

export function hitGraph(sample, cfg, x, y) {
  const L = graphLayout(cfg)
  let best = null
  let bestD = Math.max(L.rowH, 8)
  sample.dots.forEach((d, i) => {
    if (!d) return
    const dist = Math.hypot(d.x - x, d.y - y)
    if (dist < bestD) {
      best = i
      bestD = dist
    }
  })
  return best
}
