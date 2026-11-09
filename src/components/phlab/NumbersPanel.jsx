import React from 'react'
import { Card, Hint } from './ui'
import { formatSci } from './format'

// "Show the numbers" (DP): the concentrations behind the pH, and what is
// actually in the beaker once acids and bases have reacted
export function NumbersPanel({ analysis, tempC, mode, setup, delivered, substances }) {
  if (!analysis) return null
  const a = analysis
  const byId = (id) => substances.find(s => s.id === id)

  return (
    <Card title="The numbers">
      <div className="space-y-1">
        <Line label="[H⁺]" value={`${formatSci(a.h)} mol dm⁻³`} />
        <Line label="pH = −log[H⁺]" value={a.pH.toFixed(2)} strong />
        <Line label="[OH⁻]" value={`${formatSci(a.oh)} mol dm⁻³`} />
        <Line label="pOH = −log[OH⁻]" value={a.pOH.toFixed(2)} />
        <Line label={`Kw = [H⁺][OH⁻] at ${tempC} °C`} value={formatSci(a.Kw)} />
        <Line label="pH + pOH = pKw" value={a.pKw.toFixed(2)} />
      </div>

      {a.species.length > 0 && (
        <div className="space-y-1 pt-2" style={{ borderTop: '1px solid #363c4a' }}>
          <p className="text-xs font-semibold" style={{ color: '#8a95a8' }}>In the beaker (mol dm⁻³)</p>
          {a.species.map(({ substance: s, c, ionised }) => (
            s.strong ? (
              <Line key={s.id} label={`${s.ion} (from ${s.formula}, fully ionised)`} value={formatSci(c)} />
            ) : (
              <React.Fragment key={s.id}>
                <Line label={s.formula} value={formatSci(c * (1 - ionised))} />
                <Line label={`${s.ion} (${percent(ionised)} of the ${s.formula} ionised)`} value={formatSci(c * ionised)} />
              </React.Fragment>
            )
          ))}
        </div>
      )}

      {mode === 'titration' && (
        <div className="space-y-1 pt-2" style={{ borderTop: '1px solid #363c4a' }}>
          <Line
            label={`n(${byId(setup.analyte.substance).formula}) in the flask at the start`}
            value={`${formatSci((setup.analyte.conc * setup.analyte.volume) / 1000)} mol`}
          />
          <Line
            label={`n(${byId(setup.titrant.substance).formula}) added from the burette`}
            value={`${formatSci((setup.titrant.conc * delivered) / 1000)} mol`}
          />
        </div>
      )}

      <Hint>Ka and Kb stay at their 25 °C values: in this model temperature changes only Kw.</Hint>
    </Card>
  )
}

function percent(f) {
  const p = f * 100
  return `${p < 1 ? p.toFixed(2) : p < 10 ? p.toFixed(1) : Math.round(p)} %`
}

function Line({ label, value, strong }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-xs">
      <span style={{ color: '#c8cdd8' }}>{label}</span>
      <span className="font-mono whitespace-nowrap" style={{ color: strong ? '#e8eaf0' : '#c8cdd8', fontWeight: strong ? 700 : 500 }}>
        {value}
      </span>
    </div>
  )
}
