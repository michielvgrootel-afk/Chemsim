import React from 'react'
import { Card, Chip, ActionButton, Hint } from './ui'

export const WATER = { id: 'water', formula: 'H₂O', name: 'water', color: '#8ab4f0' }

const describe = (s) => (s.id === 'water' ? 'water' : `${s.strong ? 'strong' : 'weak'} ${s.type}`)

function SubstanceChip({ substance, active, onClick }) {
  const color = substance.color
  return (
    <button
      onClick={onClick}
      aria-pressed={!!active}
      className="flex flex-col items-center justify-center px-2 py-1.5 rounded-md cursor-pointer border-0 transition-colors"
      style={{
        background: active ? color : '#1e2535',
        border: `1px solid ${active ? color : '#363c4a'}`,
        color: active ? '#fff' : '#e8eaf0',
        minHeight: 44,
        minWidth: 68,
      }}
    >
      <span className="text-sm font-bold leading-tight">{substance.formula}</span>
      <span className="text-[10px] leading-tight" style={{ opacity: 0.85 }}>{describe(substance)}</span>
    </button>
  )
}

function ConcChips({ values, value, onChange, color }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {values.map(c => (
        <Chip key={c} active={c === value} color={color} onClick={() => onChange(c)}>
          {c >= 1 ? c.toFixed(1) : c}
        </Chip>
      ))}
      <span className="text-xs" style={{ color: '#6b7585' }}>mol dm⁻³</span>
    </div>
  )
}

const amountLabel = (v) => (Math.abs(v - 0.05) < 1e-9 ? '1 drop' : `${v} cm³`)

// Free lab: choose what to add and how much; pour out or evaporate
export function FreeLabControls({ config, choice, onChoice, onStep, onPourStart, onPourEnd, pouring }) {
  const options = [...config.substances, WATER]
  const chosen = options.find(s => s.id === choice.substance) || options[0]
  const isWater = chosen.id === 'water'

  // Pointer capture keeps the release on the button even if the pointer
  // slides off; if capture isn't available, leaving the button stops the pour
  const holdHandlers = {
    onPointerDown: (e) => {
      try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* optional */ }
      onPourStart()
    },
    onPointerUp: onPourEnd,
    onPointerCancel: onPourEnd,
    onPointerLeave: onPourEnd,
    onLostPointerCapture: onPourEnd,
    onKeyDown: (e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) onPourStart() },
    onKeyUp: (e) => { if (e.key === ' ' || e.key === 'Enter') onPourEnd() },
  }

  return (
    <>
      <Card title="Add to the beaker">
        <div className="flex flex-wrap gap-1.5">
          {options.map(s => (
            <SubstanceChip key={s.id} substance={s} active={s.id === chosen.id}
              onClick={() => onChoice({ ...choice, substance: s.id })} />
          ))}
        </div>
        {!isWater && (
          <ConcChips values={config.concentrations} value={choice.conc} color={chosen.color}
            onChange={(conc) => onChoice({ ...choice, conc })} />
        )}
        <div className="grid grid-cols-4 gap-1.5">
          {config.addAmounts.map(v => (
            <ActionButton key={v} small color={chosen.color} onClick={() => onStep(isWater ? 'water' : 'add', v)}>
              {amountLabel(v)}
            </ActionButton>
          ))}
        </div>
        <ActionButton color={chosen.color} active={pouring} className="w-full" {...holdHandlers}>
          {pouring ? `Pouring ${chosen.formula}…` : `Hold to pour ${chosen.formula}`}
        </ActionButton>
        <Hint>
          {isWater
            ? 'Adding water dilutes whatever is in the beaker.'
            : `Adds ${chosen.name} solution of the concentration chosen above.`}
        </Hint>
      </Card>

      <Card title="Remove liquid">
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-xs flex-1" style={{ color: '#c8cdd8' }}>Pour out solution</span>
            {config.removeAmounts.map(v => (
              <ActionButton key={v} small color="#8a95a8" onClick={() => onStep('pourOut', v)}>{v} cm³</ActionButton>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs flex-1" style={{ color: '#c8cdd8' }}>Evaporate water</span>
            {config.removeAmounts.map(v => (
              <ActionButton key={v} small color="#f0913a" onClick={() => onStep('evaporate', v)}>{v} cm³</ActionButton>
            ))}
          </div>
        </div>
        <Hint>Pouring out takes some of the solution away. Evaporating removes only the water.</Hint>
      </Card>
    </>
  )
}

// Titration: what is in the flask and the burette, and the burette controls
export function TitrationControls({ config, setup, onSetup, delivered, tapRate, onTap, onStep }) {
  const t = config.titration
  const byId = (id) => config.substances.find(s => s.id === id)
  const analyte = byId(setup.analyte.substance)
  const titrant = byId(setup.titrant.substance)
  const titrantOptions = config.substances.filter(s => s.type !== analyte.type)

  return (
    <>
      <Card title="In the flask">
        <div className="flex flex-wrap gap-1.5">
          {config.substances.map(s => (
            <SubstanceChip key={s.id} substance={s} active={s.id === analyte.id}
              onClick={() => onSetup({ analyte: { substance: s.id } })} />
          ))}
        </div>
        <ConcChips values={config.concentrations} value={setup.analyte.conc} color={analyte.color}
          onChange={(conc) => onSetup({ analyte: { conc } })} />
        <div className="flex items-center gap-1.5 flex-wrap">
          {t.analyteVolumes.map(v => (
            <Chip key={v} active={v === setup.analyte.volume} color={analyte.color}
              onClick={() => onSetup({ analyte: { volume: v } })}>
              {v.toFixed(2)}
            </Chip>
          ))}
          <span className="text-xs" style={{ color: '#6b7585' }}>cm³</span>
        </div>
      </Card>

      <Card title="In the burette">
        <div className="flex flex-wrap gap-1.5">
          {titrantOptions.map(s => (
            <SubstanceChip key={s.id} substance={s} active={s.id === titrant.id}
              onClick={() => onSetup({ titrant: { substance: s.id } })} />
          ))}
        </div>
        <ConcChips values={config.concentrations} value={setup.titrant.conc} color={titrant.color}
          onChange={(conc) => onSetup({ titrant: { conc } })} />
        <Hint>Changing the flask or the burette starts a new titration.</Hint>
      </Card>

      <Card title="Burette" right={
        <span className="text-sm font-mono font-semibold" style={{ color: '#e8eaf0' }}>{delivered.toFixed(2)} cm³ added</span>
      }>
        <div className="flex items-center gap-1.5">
          <span className="text-xs mr-1" style={{ color: '#c8cdd8' }}>Tap</span>
          <Chip active={!(tapRate > 0)} color="#6b7585" onClick={() => onTap(0)}>Closed</Chip>
          <Chip active={tapRate > 0 && tapRate === t.tapRates.slow} color={titrant.color} onClick={() => onTap(t.tapRates.slow)}>Slow</Chip>
          <Chip active={tapRate > 0 && tapRate === t.tapRates.fast} color={titrant.color} onClick={() => onTap(t.tapRates.fast)}>Fast</Chip>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <ActionButton color={titrant.color} onClick={() => onStep(0.05, 'Added 1 drop from the burette')}>+ 1 drop</ActionButton>
          <ActionButton color={titrant.color} onClick={() => onStep(t.stepVolume, `Added ${t.stepVolume.toFixed(2)} cm³ from the burette`)}>
            + {t.stepVolume.toFixed(2)} cm³
          </ActionButton>
        </div>
        <Hint>Slow down near the equivalence point: one drop can change the pH by several units.</Hint>
      </Card>
    </>
  )
}
