// Intermolecular forces model (London dispersion lab). Builds a drawable
// molecule (atoms, bonds and every electron) from a displayed formula, and
// models the electrons' fluctuating distribution that makes temporary and
// induced dipoles. Pure data and functions, no React.
//
// This is the textbook picture of London forces, slowed down enormously:
// real dispersion forces come from quantum fluctuations far faster than
// anything that could be animated.

export const UNIT = 62   // px per C–C bond; structures are written in these units

// Per element: nucleus drawing, inner (non-bonding) shells drawn as rings
// of dots, and how far valence electrons move in a fluctuation. Bigger,
// more diffuse electron clouds are distorted more easily (polarisability).
export const ELEMENTS = {
  H: { r: 9, fill: '#e8eaf0', text: '#1a1d24', shells: [], mobility: 1.0 },
  C: { r: 11, fill: '#3a4150', text: '#e8eaf0', shells: [2], mobility: 1.0 },
  O: { r: 11, fill: '#c94a4a', text: '#ffffff', shells: [2], mobility: 0.85 },
  F: { r: 9, fill: '#a9cf5a', text: '#1a1d24', shells: [2], mobility: 0.55 },
  Cl: { r: 9, fill: '#3dba7e', text: '#1a1d24', shells: [2, 8], mobility: 0.8 },
  Br: { r: 9, fill: '#b5525b', text: '#ffffff', shells: [2, 8, 18], mobility: 1.05 },
  I: { r: 10, fill: '#8a5bd6', text: '#ffffff', shells: [2, 8, 18, 18], mobility: 1.3 },
}

const HALOGENS = ['F', 'Cl', 'Br', 'I']
const ringRadius = (shell) => 15 + 9 * shell

// Where an atom's valence electrons sit: on the outer ring for a halogen,
// just outside the inner shell for C and O, at the edge for H
export function valenceRadius(el) {
  if (HALOGENS.includes(el)) return ringRadius(ELEMENTS[el].shells.length)
  return el === 'H' ? ELEMENTS.H.r : 19
}

// Bond length (in units) between two halogen atoms whose outer rings just overlap
export function halogenBond(el) {
  return (1.62 * valenceRadius(el)) / UNIT
}

// ---------- Building a molecule ----------
// structure: { atoms: [{ el, x, y }], bonds: [[i, j, order]],
//   lonePairs: [[atom, dx, dy]], charges: [[atom, δ]] (δ > 0: δ−),
//   hDonor, hAcceptor } with x, y in units.

export function buildMolecule(structure) {
  const atoms = structure.atoms.map(a => {
    const e = ELEMENTS[a.el]
    const halogen = HALOGENS.includes(a.el)
    return {
      el: a.el,
      x: a.x * UNIT,
      y: a.y * UNIT,
      r: e.r,
      fill: e.fill,
      text: e.text,
      valenceR: valenceRadius(a.el),
      surfaceR: halogen ? valenceRadius(a.el) + 3 : e.r,       // outer edge for contact
      cloudR: halogen ? valenceRadius(a.el) + 12 : a.el === 'H' ? 20 : 27,
      rings: e.shells.map((n, s) => ringRadius(s)),
      charge: 0,
    }
  })
  for (const [i, p] of structure.charges || []) atoms[i].charge = p

  const electrons = []
  const lonePairPoints = []

  // Inner shells: rings of tightly held electrons that barely move
  atoms.forEach((a, i) => {
    ELEMENTS[a.el].shells.forEach((n, s) => {
      const r = ringRadius(s)
      for (let k = 0; k < n; k++) {
        const angle = Math.PI / 4 + (2 * Math.PI * k) / n
        electrons.push({ x: a.x + r * Math.cos(angle), y: a.y + r * Math.sin(angle), mobility: 0.06 + 0.08 * s, core: true, atom: i })
      }
    })
  })

  // Bonding pairs: two electrons per bond, between the two atoms
  for (const [i, j, order = 1] of structure.bonds) {
    const a = atoms[i]
    const b = atoms[j]
    const dx = b.x - a.x
    const dy = b.y - a.y
    const len = Math.hypot(dx, dy)
    const gap = len - a.valenceR - b.valenceR
    const t = gap > 0 ? (a.valenceR + gap / 2) / len : 0.5
    const nx = -dy / len
    const ny = dx / len
    const mobility = (ELEMENTS[a.el].mobility + ELEMENTS[b.el].mobility) / 2
    for (const o of order === 2 ? [-10, -3.5, 3.5, 10] : [-3.5, 3.5]) {
      electrons.push({ x: a.x + dx * t + nx * o, y: a.y + dy * t + ny * o, mobility })
    }
  }

  // Lone pairs: two non-bonding electrons on one side of the atom
  for (const [i, dx, dy] of structure.lonePairs || []) {
    const a = atoms[i]
    const len = Math.hypot(dx, dy)
    const ux = dx / len
    const uy = dy / len
    const d = HALOGENS.includes(a.el) ? a.valenceR : 25
    for (const o of [-3.5, 3.5]) {
      electrons.push({ x: a.x + ux * d - uy * o, y: a.y + uy * d + ux * o, mobility: ELEMENTS[a.el].mobility })
    }
    lonePairPoints.push({ x: a.x + ux * d, y: a.y + uy * d, r: 5 })
  }

  // Everything that forms the molecule's outer surface
  const surface = atoms.map(a => ({ x: a.x, y: a.y, r: a.surfaceR })).concat(lonePairPoints)
  const xs = atoms.map(a => a.x)
  return {
    atoms,
    bonds: structure.bonds,
    electrons,
    surface,
    minX: Math.min(...atoms.map((a, i) => a.x - (atoms[i].el === 'H' ? 0 : a.valenceR))),
    maxX: Math.max(...atoms.map((a, i) => a.x + (atoms[i].el === 'H' ? 0 : a.valenceR))),
    top: Math.min(...surface.map(p => p.y - p.r)),
    bottom: Math.max(...surface.map(p => p.y + p.r)),
    centreX: (Math.min(...xs) + Math.max(...xs)) / 2,
    hDonor: structure.hDonor ?? null,
    hAcceptor: structure.hAcceptor ?? null,
  }
}

// ---------- The fluctuating electron distribution ----------
// The two molecules lie one above the other, so the dipoles that matter
// point from one to the other. u(x) is how far the electrons near x are
// shifted down (+) or up (−) at this instant: down makes that part's lower
// side δ− and its upper side δ+. u is a sum of smooth waves along the
// molecule whose sizes drift at random: a small molecule shifts as a whole,
// a long chain has several patches going up or down independently.

export function createField(x0, x1, patch = 2 * UNIT) {
  const L = Math.max(1, x1 - x0)
  const modes = Math.max(1, Math.round(L / patch))
  const zeros = () => new Array(modes).fill(0)
  return { x0, L, modes, drive: zeros(), c: zeros(), lag: zeros() }
}

// Advance the wave sizes: a random drive pulled back to zero over `tau`,
// smoothed so the electrons glide instead of jumping. The typical shift
// anywhere along the molecule is `amplitude` px, whatever its length.
// `lag` trails a moment behind: what the neighbour responds to.
export function stepField(field, dt, tau, amplitude, gauss) {
  const smooth = tau / 3
  const decay = Math.exp(-dt / tau)
  const ease = 1 - Math.exp(-dt / smooth)
  const follow = 1 - Math.exp(-dt / 0.04)
  const boost = Math.sqrt((tau + smooth) / tau)   // smoothing narrows the spread; restore it
  for (let k = 0; k < field.modes; k++) {
    const sigma = amplitude * boost * Math.sqrt((k === 0 ? 1 : 2) / field.modes)
    field.drive[k] = field.drive[k] * decay + sigma * Math.sqrt(1 - decay * decay) * gauss()
    field.c[k] += (field.drive[k] - field.c[k]) * ease
    field.lag[k] += (field.c[k] - field.lag[k]) * follow
  }
}

// Downward shift (px) of the electrons at x (local coordinates)
export function shiftAt(field, x, lagged = false) {
  const s = Math.max(0, Math.min(1, (x - field.x0) / field.L))
  const c = lagged ? field.lag : field.c
  let u = 0
  for (let k = 0; k < field.modes; k++) u += c[k] * Math.cos(k * Math.PI * s)
  return u
}

// Standard normal random number (Box–Muller)
export function gauss() {
  const u = 1 - Math.random()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random())
}

// ---------- Colours ----------

const NEUTRAL = [196, 202, 214]
const DELTA_MINUS = [236, 84, 84]    // red: more electrons
const DELTA_PLUS = [86, 150, 245]    // blue: fewer electrons

// Cloud colour for v in [−1, 1] (v > 0: extra electrons, δ−)
export function cloudColor(v) {
  const t = Math.min(1, Math.abs(v))
  const target = v > 0 ? DELTA_MINUS : DELTA_PLUS
  const rgb = NEUTRAL.map((c, i) => Math.round(c + (target[i] - c) * t))
  return `rgba(${rgb.join(", ")}, ${(0.16 + 0.34 * t).toFixed(3)})`
}

// Phase of a substance at a temperature (°C)
export function stateAt(molecule, tempC) {
  if (tempC >= molecule.bp) return 'gas'
  if (molecule.mp != null && tempC < molecule.mp) return 'solid'
  return 'liquid'
}
