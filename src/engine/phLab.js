// pH lab chemistry (pH Scale Sandbox): the exact pH of a beaker holding
// strong and weak acids and bases, Kw at any temperature, and indicator
// colours. Pure functions, no React, so they can be checked on their own.
//
// A beaker is { volume (cm³), moles: { [substanceId]: mol } }, where moles
// are the amounts added. Substances come from the scenario config:
// { id, type: 'acid' | 'base', strong, pKa (weak acid) | pKb (weak base) }.
// An acid and a base in the same beaker neutralise each other through the
// charge balance in solveH, so no reaction bookkeeping is needed.

// pKw of pure water from 0 to 100 °C (IB data: Kw = 1.00 × 10⁻¹⁴ at 25 °C)
const PKW_TABLE = [
  [0, 14.94], [10, 14.53], [20, 14.17], [25, 14.0], [30, 13.83], [40, 13.53],
  [50, 13.26], [60, 13.02], [70, 12.8], [80, 12.6], [90, 12.42], [100, 12.26],
]

export function pKwAt(tempC) {
  const last = PKW_TABLE[PKW_TABLE.length - 1]
  const t = Math.max(PKW_TABLE[0][0], Math.min(last[0], tempC))
  for (let i = 1; i < PKW_TABLE.length; i++) {
    const [t1, p1] = PKW_TABLE[i]
    if (t <= t1) {
      const [t0, p0] = PKW_TABLE[i - 1]
      return p0 + ((t - t0) / (t1 - t0)) * (p1 - p0)
    }
  }
  return last[1]
}

const ka = (s) => 10 ** -s.pKa
const kb = (s) => 10 ** -s.pKb

// [H⁺] in mol dm⁻³ from the charge balance
//   [H⁺] + [Na⁺] + [BH⁺] = [OH⁻] + [Cl⁻] + [A⁻]
// with [A⁻] = c·Ka / (Ka + [H⁺]) for a weak acid and
// [BH⁺] = c·[H⁺] / ([H⁺] + Kw/Kb) for a weak base. Left minus right rises
// steadily with [H⁺], so halving the search range on log[H⁺] always finds
// the one answer. Returns null for an empty beaker.
export function solveH(beaker, substances, Kw) {
  if (!beaker || beaker.volume <= 0) return null
  const litres = beaker.volume / 1000
  const present = []
  for (const s of substances) {
    const n = beaker.moles[s.id]
    if (n > 0) present.push({ s, c: n / litres })
  }
  const balance = (h) => {
    let sum = h - Kw / h
    for (const { s, c } of present) {
      if (s.type === 'acid') sum -= s.strong ? c : (c * ka(s)) / (ka(s) + h)
      else sum += s.strong ? c : (c * h) / (h + Kw / kb(s))
    }
    return sum
  }
  let lo = -18
  let hi = 2
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2
    if (balance(10 ** mid) > 0) hi = mid
    else lo = mid
  }
  return 10 ** ((lo + hi) / 2)
}

// Everything the lab shows about a beaker: pH, pOH, [H⁺], [OH⁻], Kw and,
// for every substance present, its concentration and the fraction ionised.
export function analyse(beaker, substances, tempC) {
  const pKw = pKwAt(tempC)
  const Kw = 10 ** -pKw
  const h = solveH(beaker, substances, Kw)
  if (h == null) return null
  const oh = Kw / h
  const litres = beaker.volume / 1000
  const species = []
  for (const s of substances) {
    const n = beaker.moles[s.id]
    if (!(n > 0)) continue
    const ionised = s.strong ? 1
      : s.type === 'acid' ? ka(s) / (ka(s) + h)
      : h / (h + Kw / kb(s))
    species.push({ substance: s, c: n / litres, ionised })
  }
  return { h, oh, pH: -Math.log10(h), pOH: -Math.log10(oh), Kw, pKw, neutralPH: pKw / 2, species }
}

// ---------- Beaker changes (each returns a new beaker) ----------

export function addSolution(beaker, substanceId, conc, volume) {
  const moles = { ...beaker.moles, [substanceId]: (beaker.moles[substanceId] || 0) + (conc * volume) / 1000 }
  return { volume: beaker.volume + volume, moles }
}

export function addWater(beaker, volume) {
  return { volume: beaker.volume + volume, moles: beaker.moles }
}

// Pouring out keeps every concentration: each amount shrinks with the volume
export function pourOut(beaker, volume) {
  const left = Math.max(0, beaker.volume - volume)
  const keep = beaker.volume > 0 ? left / beaker.volume : 0
  const moles = {}
  for (const [id, n] of Object.entries(beaker.moles)) moles[id] = n * keep
  return { volume: left, moles }
}

// Evaporating removes only water, so every concentration rises
export function evaporate(beaker, volume) {
  return { volume: Math.max(0, beaker.volume - volume), moles: beaker.moles }
}

// ---------- Titration ----------
// setup = { analyte: { substance, conc, volume }, titrant: { substance, conc } }

// The flask after `delivered` cm³ have run in from the burette
export function titrationBeaker(setup, delivered) {
  const flask = addSolution({ volume: 0, moles: {} }, setup.analyte.substance, setup.analyte.conc, setup.analyte.volume)
  return delivered > 0 ? addSolution(flask, setup.titrant.substance, setup.titrant.conc, delivered) : flask
}

// Titrant volume (cm³) that exactly neutralises the analyte (1 : 1)
export function equivalenceVolume(setup) {
  return (setup.analyte.conc * setup.analyte.volume) / setup.titrant.conc
}

// ---------- Indicator colours ----------

// Universal indicator, from red (pH 0) through green (7) to violet (14)
const UNIVERSAL_STOPS = [
  [0, '#c81e32'], [1, '#e02f2f'], [2, '#ec5428'], [3, '#f37f2a'], [4, '#f6a630'],
  [5, '#f2cf3a'], [6, '#c3d63a'], [7, '#4fbf4f'], [8, '#26a985'], [9, '#2b8fcf'],
  [10, '#3a66c4'], [11, '#5550b5'], [12, '#6a45aa'], [13, '#74389c'], [14, '#6b2c8c'],
]

// 'clear' is a colourless indicator form (e.g. phenolphthalein in acid)
const CLEAR = [200, 220, 240, 0.22]

function toRGBA(color) {
  if (color === 'clear') return CLEAR
  const hex = color.replace('#', '')
  return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16), 0.9]
}

function mix(a, b, f) {
  return a.map((v, i) => v + (b[i] - v) * f)
}

function css([r, g, b, a]) {
  return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a.toFixed(2)})`
}

export function universalColor(pH) {
  const p = Math.max(0, Math.min(14, pH))
  for (let i = 1; i < UNIVERSAL_STOPS.length; i++) {
    const [p1, c1] = UNIVERSAL_STOPS[i]
    if (p <= p1) {
      const [p0, c0] = UNIVERSAL_STOPS[i - 1]
      return css(mix(toRGBA(c0), toRGBA(c1), (p - p0) / (p1 - p0)))
    }
  }
  return css(toRGBA(UNIVERSAL_STOPS[UNIVERSAL_STOPS.length - 1][1]))
}

// Colour of the solution with a given indicator. Indicators with a range
// change smoothly from their acid colour to their base colour across it.
export function indicatorColor(indicator, pH) {
  if (!indicator || indicator.low == null) return universalColor(pH)
  const x = Math.max(0, Math.min(1, (pH - indicator.low) / (indicator.high - indicator.low)))
  const f = x * x * (3 - 2 * x)
  return css(mix(toRGBA(indicator.acidColor), toRGBA(indicator.baseColor), f))
}
