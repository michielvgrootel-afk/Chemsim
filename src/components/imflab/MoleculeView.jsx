import React, { useEffect, useRef } from 'react'
import {
  buildMolecule, createField, stepField, shiftAt, gauss, cloudColor, UNIT, ELEMENTS,
} from '../../engine/imfModel'

export const VIEW_W = 800
export const VIEW_H = 440
const MARGIN = 44         // px kept free above and below for δ labels
const G0 = 40             // px between the two molecules' outer atoms when touching
const AMPLITUDE = 7       // px: typical up/down shift of a valence electron
const TAU = 0.45          // s a temporary dipole lasts (real ones: far, far shorter)
const SAMPLE = 10         // px between attraction samples
const LABEL_LEVEL = 0.55  // |δ| (1 = full colour) needed before a δ+ / δ− label appears
const REACH = 1.5 * UNIT  // px along a turned molecule over which its induced dipole fades

const ELECTRON = '#f5d76e'
const INNER_ELECTRON = '#cdb76f'
const LDF_LINE = '245, 230, 168'
const DIPOLE_LINE = '#f0913a'
const HBOND_LINE = '#4fd1c5'

// Two molecules close up, every electron drawn. The top molecule's electrons
// shift towards or away from the lower one (temporary dipole); the lower
// one's electrons are pushed the same way (induced dipole), so the two
// facing sides are always δ− opposite δ+.
// Below the boiling point the pair stays together; above it they fly apart
// and only meet when they collide.
// `speed` scales the whole animation (1 = normal, 0.1 = ten times slower).
// `angle` (degrees, 0–90) turns the lower molecule from side by side to end on.
export function MoleculeView({ molecule, state, tempK, show, paused, speed = 1, angle = 0, onAttraction }) {
  const canvasRef = useRef(null)
  const simRef = useRef(null)
  const live = useRef({})
  live.current = { state, tempK, show, paused, speed, angle, onAttraction, target: molecule.dHvap }

  // Sharp on high-DPI screens; drawing stays in VIEW_W × VIEW_H units and
  // the canvas scales to fit its column
  useEffect(() => {
    const canvas = canvasRef.current
    const dpr = window.devicePixelRatio || 1
    canvas.width = VIEW_W * dpr
    canvas.height = VIEW_H * dpr
    canvas.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0)
  }, [])

  useEffect(() => {
    simRef.current = createSim(molecule, live.current.angle)
  }, [molecule])

  useEffect(() => {
    let raf
    let last = performance.now()
    let lastReport = 0
    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const sim = simRef.current
      const canvas = canvasRef.current
      const p = live.current
      if (sim && canvas) {
        if (sim.angle !== p.angle) {
          setAngle(sim, p.angle)
          sim.frame = measure(sim)
        }
        if (!p.paused) advance(sim, dt * p.speed, p)
        draw(canvas.getContext('2d'), sim, p.show)
        if (now - lastReport > 150) {
          lastReport = now
          p.onAttraction?.(sim.meter)
        }
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={`Two ${molecule.name.toLowerCase()} molecules with their electrons`}
      style={{ width: '100%', height: 'auto', aspectRatio: `${VIEW_W} / ${VIEW_H}`, display: 'block', borderRadius: 8, background: '#1a1d24' }}
    />
  )
}

// ---------- Layout ----------

function createSim(molecule, angle) {
  const mol = buildMolecule(molecule.structure)
  const arrangement = molecule.arrangement || {}
  const sim = {
    mol,
    sx: arrangement.mirror ? -1 : 1,
    sy: arrangement.flipY ? -1 : 1,
    offset: (arrangement.dx || 0) * UNIT,
    // The top molecule in its own coordinates (it never turns)
    upper: mol.atoms.map(a => ({ ...a, lx: a.x, ly: a.y })),
    angle: null,
    home: null,
    pos: null,
    jitter: { ax: 0, ay: 0, bx: 0, by: 0 },
    fieldA: createField(mol.minX, mol.maxX),
    fieldB: createField(mol.minX, mol.maxX),
    deltaScale: 1,
    t: 0,
    phase: 0.5,
    side: 1,
    avg: 1,
    meter: 0,
    frame: null,
  }

  // δ strength on a 0–1 colour scale: a typical shift shows as ~0.7, times
  // how easily this molecule's electrons move (I₂ much more than F₂)
  const heavy = mol.atoms.filter(a => a.el !== 'H')
  const polarisability = heavy.reduce((sum, a) => sum + ELEMENTS[a.el].mobility, 0) / heavy.length
  sim.deltaScale = polarisability / (1.4 * AMPLITUDE)

  // Average attraction side by side, so the meter can be scaled to the real
  // enthalpy of vaporisation (the fluctuations also start mid-flow). Turned
  // molecules touch less, so their attraction shows below that average.
  setAngle(sim, 0)
  let total = 0
  for (let i = 0; i < 600; i++) {
    stepField(sim.fieldA, 1 / 60, TAU, AMPLITUDE, gauss)
    stepField(sim.fieldB, 1 / 60, TAU, AMPLITUDE * 0.15, gauss)
    total += measure(sim).V
  }
  sim.avg = Math.max(1e-6, total / 600)
  setAngle(sim, angle)
  sim.frame = measure(sim)
  return sim
}

// Place the pair with the lower molecule turned by `degrees` about its own
// centre: it sits just below the top one, and the drawing shrinks if the
// pair doesn't fit. Lower-molecule points keep their own coordinates
// (lx along its axis, ly across it) and get turned ones (rx, ry).
function setAngle(sim, degrees) {
  const { mol, sx, sy, offset } = sim
  const th = (degrees * Math.PI) / 180
  const cos = Math.cos(th)
  const sin = Math.sin(th)
  const place = (x, y) => {
    const lx = sx * x
    const ly = sy * y
    return { lx, ly, rx: lx * cos - ly * sin, ry: lx * sin + ly * cos }
  }
  const atoms = mol.atoms.map(a => ({ ...a, ...place(a.x, a.y) }))
  const surface = mol.surface.map(p => ({ r: p.r, ...place(p.x, p.y) }))
  const electrons = mol.electrons.map(e => ({ ...e, ...place(e.x, e.y) }))
  const topB = Math.min(...surface.map(p => p.ry - p.r))
  const bottomB = Math.max(...surface.map(p => p.ry + p.r))
  const minX = Math.min(...surface.map(p => p.rx - p.r))
  const maxX = Math.max(...surface.map(p => p.rx + p.r))
  const along = atoms.map(a => a.lx)
  // Height (sin · lx) of the end nearest the top molecule
  const nearEnd = Math.min(sin * Math.min(...along), sin * Math.max(...along))

  const stack = (mol.bottom - mol.top) + G0 + (bottomB - topB)
  const left = Math.min(mol.minX, offset + minX)
  const right = Math.max(mol.maxX, offset + maxX)
  const scale = Math.min(1, (VIEW_H - 2 * MARGIN) / stack, VIEW_W / (right - left + 120))
  const vw = VIEW_W / scale
  const vh = VIEW_H / scale
  const cyA = (vh - stack) / 2 - mol.top
  const cx = vw / 2 - (left + right) / 2
  const home = { ax: cx, ay: cyA, bx: cx + offset, by: cyA + mol.bottom + G0 - topB }

  // Keep any jiggle or gas flight when the layout changes
  if (sim.pos) for (const k in home) sim.pos[k] += home[k] - sim.home[k]
  else sim.pos = { ...home }
  Object.assign(sim, {
    angle: degrees,
    cos,
    sin,
    home,
    scale,
    vw,
    vh,
    topB,
    nearEnd,
    room: Math.max(0, (vh - stack) / 2 - 40),   // how far each can move away
    lower: { atoms, surface, electrons, minX, maxX },
  })
}

// ---------- Motion ----------

function smoothstep(x) {
  const t = Math.max(0, Math.min(1, x))
  return t * t * (3 - 2 * t)
}

function advance(sim, dt, { state, tempK, target }) {
  sim.t += dt
  stepField(sim.fieldA, dt, TAU, AMPLITUDE, gauss)
  stepField(sim.fieldB, dt, TAU, AMPLITUDE * 0.15, gauss)

  // Thermal jiggle grows with temperature (kinetic energy ∝ T)
  const heat = Math.sqrt(Math.max(20, tempK) / 298)
  const size = (state === 'solid' ? 1.2 : 3.5) * heat
  const decay = Math.exp(-dt / 0.25)
  const kick = size * Math.sqrt(1 - decay * decay)
  for (const k of ['ax', 'ay', 'bx', 'by']) sim.jitter[k] = sim.jitter[k] * decay + kick * gauss()

  // Gas: fly apart, meet briefly in a collision, fly apart again
  let sep = 0
  let lat = 0
  if (state === 'gas') {
    sim.phase += dt * heat / 3.2
    if (sim.phase >= 1) {
      sim.phase -= 1
      sim.side = Math.random() < 0.5 ? -1 : 1
    }
    const apart = smoothstep((Math.abs(sim.phase - 0.5) * 2 - 0.12) / 0.5)
    sep = sim.room * apart
    lat = 90 * sim.side * apart
  } else {
    sim.phase = 0.5
    if (state === 'liquid') lat = 12 * Math.sin(sim.t * 0.6)   // liquids slide past each other
  }

  const targetPos = {
    ax: sim.home.ax - lat / 2 + sim.jitter.ax,
    ay: sim.home.ay - sep + sim.jitter.ay,
    bx: sim.home.bx + lat / 2 + sim.jitter.bx,
    by: sim.home.by + sep + sim.jitter.by,
  }
  const ease = Math.min(1, dt * 6)
  for (const k in targetPos) sim.pos[k] += (targetPos[k] - sim.pos[k]) * ease

  sim.frame = measure(sim)
  // The meter's average is kept for the molecules side by side
  const touching = sim.frame.gap < G0 + 8
  if (touching && sim.angle === 0) sim.avg += (sim.frame.V - sim.avg) * Math.min(1, dt / 15)
  sim.meter = (target * sim.frame.V) / sim.avg
}

// ---------- One instant: positions, δ+/δ−, attractions ----------

// The outer edge of a molecule at X: its lowest point (dir = 1) or highest
// (dir = −1), and where that is along the molecule (u)
function edgePoint(points, X, dir) {
  let best = null
  for (const p of points) {
    const reach = Math.max(p.r, UNIT / 2)
    if (Math.abs(X - p.X) > reach) continue
    const y = p.Y + dir * p.r
    if (best === null || dir * y > dir * best.y) best = { y, u: p.u }
  }
  return best
}

// Falls off quickly once the two surfaces are further apart than touching
const closeness = (gap, softness) => 1 / (1 + Math.pow(Math.max(0, gap - G0) / softness, 3))

function measure(sim) {
  const { mol, pos, lower, cos, sin } = sim
  const A = { x: pos.ax, y: pos.ay }
  const B = { x: pos.bx, y: pos.by }
  const gap = (B.y + sim.topB) - (A.y + mol.bottom)
  const kappa = 0.85 * closeness(gap, 30)   // how strongly B responds to A

  // Downward electron shift (px). Top molecule: its own fluctuation at X.
  const lo = A.x + mol.minX
  const hi = A.x + mol.maxX
  const near = (X) => Math.exp(-(((X < lo ? lo - X : X > hi ? X - hi : 0) / 30) ** 2))
  const shiftA = (X) => shiftAt(sim.fieldA, X - A.x)
  // Lower molecule, at u along its own axis: pushed the same way where the
  // top molecule lies right above it, fading along a turned molecule away
  // from the end that touches, plus its own small wobble
  const shiftB = (u) => {
    const X = B.x + cos * u
    const fade = Math.exp(-(((sin * u - sim.nearEnd) / REACH) ** 2))
    return kappa * near(X) * fade * shiftAt(sim.fieldA, X - A.x, true) + shiftAt(sim.fieldB, sim.sx * u)
  }
  // The same as a dipole on the 0–1 colour scale: > 0 means shifted down
  const dipA = (X) => sim.deltaScale * shiftA(X)
  const dipB = (u) => sim.deltaScale * shiftB(u)

  const atomsA = mol.atoms.map(a => ({ ...a, X: A.x + a.x, Y: A.y + a.y }))
  const atomsB = lower.atoms.map(a => ({ ...a, X: B.x + a.rx, Y: B.y + a.ry }))
  const surfA = mol.surface.map(p => ({ X: A.x + p.x, Y: A.y + p.y, r: p.r, u: p.x }))
  const surfB = lower.surface.map(p => ({ X: B.x + p.rx, Y: B.y + p.ry, r: p.r, u: p.lx }))

  // London forces: A's lower side δ− above B's facing side δ+ (or the other
  // way round), wherever the two surfaces are close
  const from = Math.max(lo, B.x + lower.minX)
  const to = Math.min(hi, B.x + lower.maxX)
  const samples = []
  let ldf = 0
  for (let X = from; X <= to; X += SAMPLE) {
    const edgeA = edgePoint(surfA, X, 1)
    const edgeB = edgePoint(surfB, X, -1)
    if (!edgeA || !edgeB) continue
    const a = Math.max(0, dipA(X) * dipB(edgeB.u)) * closeness(edgeB.y - edgeA.y, 22)
    samples.push({ X, yA: edgeA.y, yB: edgeB.y, a })
    ldf += a * SAMPLE
  }

  // Permanent dipoles: δ− atoms above δ+ atoms (and the reverse)
  const dipoles = []
  let permanent = 0
  for (const a of atomsA) {
    if (Math.abs(a.charge) < 0.2) continue
    for (const b of atomsB) {
      if (Math.abs(b.charge) < 0.2 || a.charge * b.charge >= 0 || Math.abs(a.X - b.X) > 30) continue
      const s = Math.abs(a.charge * b.charge) * closeness((b.Y - b.r) - (a.Y + a.r) - 60, 40)
      dipoles.push({ a, b, s })
      permanent += s
    }
  }

  // Hydrogen bond: A's O–H hydrogen pointing at a lone pair on B's oxygen
  let hbond = null
  if (mol.hDonor !== null && mol.hAcceptor !== null) {
    const h = atomsA[mol.hDonor]
    const o = atomsB[mol.hAcceptor]
    if (Math.abs(h.X - o.X) < 30) {
      const s = closeness((o.Y - 30) - (h.Y + h.r) - 60, 40)
      hbond = { h, o, s }
      permanent += 2.5 * s
    }
  }

  return { A, B, gap, kappa, shiftA, shiftB, dipA, dipB, atomsA, atomsB, surfB, samples, dipoles, hbond, V: ldf / 200 + permanent }
}

// ---------- Drawing ----------

function draw(ctx, sim, show) {
  ctx.save()
  ctx.fillStyle = '#1a1d24'
  ctx.fillRect(0, 0, VIEW_W, VIEW_H)
  ctx.scale(sim.scale, sim.scale)
  const f = sim.frame
  const { mol } = sim

  if (show.cloud) {
    drawCloud(ctx, { x: f.A.x, y: f.A.y, cos: 1, sin: 0 }, sim.upper, (u) => f.dipA(f.A.x + u))
    drawCloud(ctx, { x: f.B.x, y: f.B.y, cos: sim.cos, sin: sim.sin }, sim.lower.atoms, f.dipB)
  }
  if (show.lines) drawAttractions(ctx, f)
  drawBonds(ctx, f.atomsA, mol.bonds)
  drawBonds(ctx, f.atomsB, mol.bonds)
  drawAtoms(ctx, f.atomsA)
  drawAtoms(ctx, f.atomsB)
  if (show.dots) drawElectrons(ctx, sim, f)
  if (show.labels) {
    drawDipoleLabels(ctx, sim, f)
    drawPermanentLabels(ctx, f.atomsA)
    drawPermanentLabels(ctx, f.atomsB)
  }
  drawCaptions(ctx, sim, f)
  ctx.restore()
}

// Electron cloud: one shape around all the atoms, drawn in the molecule's
// own (possibly turned) frame: red where electrons have gathered (δ−), blue
// where they have thinned out (δ+). The electrons shift down the screen, so
// across a lying molecule that colours its upper and lower halves; along a
// turned one, the end they move away from and the part they pile into.
// Permanent partial charges colour both halves.
function drawCloud(ctx, at, atoms, dip) {
  ctx.save()
  ctx.translate(at.x, at.y)
  ctx.rotate(Math.atan2(at.sin, at.cos))
  const x0 = Math.min(...atoms.map(a => a.lx - a.cloudR))
  const x1 = Math.max(...atoms.map(a => a.lx + a.cloudR))
  const shape = new Path2D()
  for (const a of atoms) {
    shape.moveTo(a.lx + a.cloudR, a.ly)
    shape.arc(a.lx, a.ly, a.cloudR, 0, Math.PI * 2)
  }
  // Shift along the molecule's axis, zero beyond its end atoms (no
  // electrons there to move), so the ends pick up their own charge
  const u0 = Math.min(...atoms.map(a => a.lx))
  const u1 = Math.max(...atoms.map(a => a.lx))
  const inside = (u) => (u < u0 || u > u1 ? 0 : dip(u))
  const H = 26
  const STOPS = 28
  for (const side of [-1, 1]) {   // upper half, lower half
    const grad = ctx.createLinearGradient(x0, 0, x1, 0)
    for (let i = 0; i <= STOPS; i++) {
      const u = x0 + ((x1 - x0) * i) / STOPS
      let v = side * at.cos * dip(u) - at.sin * (inside(u + H) - inside(u - H)) * 0.9
      for (const a of atoms) if (a.charge) v += a.charge * Math.exp(-(((u - a.lx) / 26) ** 2))
      grad.addColorStop(i / STOPS, cloudColor(Math.max(-1, Math.min(1, v))))
    }
    ctx.save()
    ctx.beginPath()
    if (side < 0) ctx.rect(x0, -1000, x1 - x0, 1002)
    else ctx.rect(x0, -2, x1 - x0, 1000)
    ctx.clip()
    ctx.fillStyle = grad
    ctx.fill(shape)
    ctx.restore()
  }
  ctx.restore()
}

function drawAttractions(ctx, f) {
  ctx.save()
  // London forces: faint, flickering lines where δ+ faces δ−
  ctx.setLineDash([3, 3])
  ctx.lineWidth = 2
  f.samples.forEach((s, i) => {
    if (i % 2 || s.a < 0.12) return
    ctx.strokeStyle = `rgba(${LDF_LINE}, ${Math.min(0.95, 0.3 + s.a / 0.6).toFixed(3)})`
    ctx.beginPath()
    ctx.moveTo(s.X, s.yA + 2)
    ctx.lineTo(s.X, s.yB - 2)
    ctx.stroke()
  })
  // Dipole–dipole: steady lines between permanent δ− and δ+
  ctx.setLineDash([])
  ctx.lineWidth = 2.5
  for (const d of f.dipoles) {
    ctx.strokeStyle = DIPOLE_LINE
    ctx.globalAlpha = Math.min(1, 0.35 + d.s)
    ctx.beginPath()
    ctx.moveTo(d.a.X, d.a.Y + d.a.r + 4)
    ctx.lineTo(d.b.X, d.b.Y - d.b.r - 4)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
  // Hydrogen bond: H on one molecule to a lone pair of O on the other
  if (f.hbond && f.hbond.s > 0.05) {
    const { h, o } = f.hbond
    ctx.strokeStyle = HBOND_LINE
    ctx.globalAlpha = Math.min(1, 0.3 + f.hbond.s)
    ctx.lineWidth = 3.5
    ctx.setLineDash([7, 5])
    ctx.beginPath()
    ctx.moveTo(h.X, h.Y + h.r + 3)
    ctx.lineTo(o.X, o.Y - 32)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = HBOND_LINE
    ctx.font = 'bold 13px Inter, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('hydrogen bond', h.X + 12, (h.Y + o.Y) / 2)
  }
  ctx.restore()
}

function drawBonds(ctx, atoms, bonds) {
  ctx.strokeStyle = '#6b7585'
  ctx.lineWidth = 2
  for (const [i, j, order = 1] of bonds) {
    const a = atoms[i]
    const b = atoms[j]
    const len = Math.hypot(b.X - a.X, b.Y - a.Y)
    const nx = -(b.Y - a.Y) / len
    const ny = (b.X - a.X) / len
    for (const o of order === 2 ? [-4, 4] : [0]) {
      ctx.beginPath()
      ctx.moveTo(a.X + nx * o, a.Y + ny * o)
      ctx.lineTo(b.X + nx * o, b.Y + ny * o)
      ctx.stroke()
    }
  }
}

function drawAtoms(ctx, atoms) {
  for (const a of atoms) {
    // Inner shells as faint rings (the electrons on them are drawn later)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.13)'
    ctx.lineWidth = 1
    for (const r of a.rings) {
      ctx.beginPath()
      ctx.arc(a.X, a.Y, r, 0, Math.PI * 2)
      ctx.stroke()
    }
    if (a.rings.length > 1) {
      ctx.setLineDash([3, 4])
      ctx.beginPath()
      ctx.arc(a.X, a.Y, a.valenceR, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])
    }
    ctx.beginPath()
    ctx.arc(a.X, a.Y, a.r, 0, Math.PI * 2)
    ctx.fillStyle = a.fill
    ctx.fill()
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)'
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.fillStyle = a.text
    ctx.font = `bold ${a.el.length > 1 ? 9 : 11}px Inter, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(a.el, a.X, a.Y + 0.5)
  }
}

function drawElectrons(ctx, sim, f) {
  const dot = (e, X, Y) => {
    ctx.fillStyle = e.core ? INNER_ELECTRON : ELECTRON
    ctx.beginPath()
    ctx.arc(X, Y, e.core ? 1.9 : 2.7, 0, Math.PI * 2)
    ctx.fill()
  }
  // Top molecule: its own fluctuation, towards or away from the lower one
  for (const e of sim.mol.electrons) {
    const X = f.A.x + e.x
    dot(e, X, f.A.y + e.y + e.mobility * f.shiftA(X))
  }
  // Lower molecule: pushed the same way by the top one's dipole
  for (const e of sim.lower.electrons) {
    dot(e, f.B.x + e.rx, f.B.y + e.ry + e.mobility * f.shiftB(e.lx))
  }
}

// Where the top molecule's dipole is strongest: δ on both of its sides and
// on both ends of the dipole it induces, so the facing pair (δ− above δ+,
// or δ+ above δ−) sits in the gap between the molecules
function drawDipoleLabels(ctx, sim, f) {
  const { mol } = sim
  const x0 = f.A.x + mol.minX
  const x1 = f.A.x + mol.maxX
  const peaks = []
  if (sim.fieldA.modes === 1) {
    peaks.push((x0 + x1) / 2)   // a small molecule shifts as a whole
  } else {
    const values = []
    for (let X = x0; X <= x1; X += 8) values.push([X, f.dipA(X)])
    let lastX = -Infinity
    values.forEach(([X, v], i) => {
      const prev = values[i - 1]?.[1] ?? 0
      const next = values[i + 1]?.[1] ?? 0
      const peak = (v > 0 && v >= prev && v >= next) || (v < 0 && v <= prev && v <= next)
      if (peak && X - lastX >= 60) {
        peaks.push(X)
        lastX = X
      }
    })
  }

  ctx.font = 'italic bold 14px Inter, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.lineWidth = 3
  ctx.strokeStyle = '#1a1d24'
  // q > 0: more electrons there (δ−)
  const label = (q, X, Y) => {
    const text = q > 0 ? 'δ−' : 'δ+'
    ctx.fillStyle = q > 0 ? '#ff7b7b' : '#7fb4ff'
    ctx.strokeText(text, X, Y)
    ctx.fillText(text, X, Y)
  }
  const across = sim.cos ** 2   // 1 lying flat, 0 standing on end
  for (const X of peaks) {
    const a = f.dipA(X)
    if (Math.abs(a) < LABEL_LEVEL) continue
    label(-a, X, f.A.y + mol.top - 12)        // upper side of the top molecule
    label(a, X - 12, f.A.y + mol.bottom + 11) // its lower side, facing the other molecule
    if (f.kappa < 0.3) continue
    const top = edgePoint(f.surfB, X, -1)
    if (!top) continue
    const b = f.dipB(top.u)
    if (Math.abs(b) < LABEL_LEVEL * 0.6) continue
    label(-b, X + 12, top.y - 11)   // the lower molecule's side facing it
    // and the other end of its induced dipole: the far side of a lying
    // molecule, a little further along one standing on end
    const bottom = edgePoint(f.surfB, X, 1)
    const depth = across * ((bottom ? bottom.y : top.y) - top.y + 16) + (1 - across) * 70
    label(b, X + sim.sin * 30, top.y + depth)
  }
}

// Permanent partial charges on polar atoms (always there)
function drawPermanentLabels(ctx, atoms) {
  ctx.font = 'bold 13px Inter, sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  for (const a of atoms) {
    if (Math.abs(a.charge) < 0.3) continue
    ctx.fillStyle = a.charge > 0 ? '#ff7b7b' : '#7fb4ff'
    ctx.fillText(a.charge > 0 ? 'δ−' : 'δ+', a.X + a.r + 3, a.Y - a.r - 6)
  }
}

function drawCaptions(ctx, sim, f) {
  const { mol } = sim
  ctx.font = '12px Inter, sans-serif'
  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#8a95a8'
  ctx.fillText('temporary dipole', f.A.x + mol.minX - 30, f.A.y)
  // Next to the part of the lower molecule that faces the top one
  if (f.kappa > 0.3) ctx.fillText('induced dipole', f.B.x + sim.lower.minX - 30, f.B.y + sim.topB - mol.top)
}
