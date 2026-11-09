// Number formatting for the pH lab

const SUPERSCRIPT = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' }

// 0.00182 → "1.82 × 10⁻³"
export function formatSci(x, digits = 3) {
  if (x == null || !Number.isFinite(x)) return '—'
  if (x === 0) return '0'
  let exp = Math.floor(Math.log10(Math.abs(x)))
  let mantissa = Number((x / 10 ** exp).toPrecision(digits))
  if (Math.abs(mantissa) >= 10) {
    mantissa /= 10
    exp += 1
  }
  const sup = String(exp).split('').map(ch => SUPERSCRIPT[ch]).join('')
  return `${mantissa.toFixed(digits - 1)} × 10${sup}`
}

// Stock concentration as students read it, e.g. "0.1 mol dm⁻³"
export function concText(c) {
  return `${c >= 1 ? c.toFixed(1) : c} mol dm⁻³`
}

// A volume added or removed: a single drop is 0.05 cm³
export function volText(v) {
  if (Math.abs(v - 0.05) < 1e-9) return '1 drop (0.05 cm³)'
  return `${v < 10 ? v.toFixed(2) : v.toFixed(1)} cm³`
}

export function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
