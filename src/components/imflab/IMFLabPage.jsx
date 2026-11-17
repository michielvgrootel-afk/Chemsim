import React, { useMemo, useState } from 'react'
import { MoleculeView } from './MoleculeView'
import { BPGraph, STATE_COLORS } from './BPGraph'
import { buildMolecule, stateAt } from '../../engine/imfModel'
import { Card, Chip, Switch, Hint } from '../LabUI'
import { StatusBar } from '../StatusBar'
import { QuizModal } from '../QuizModal'
import { ConfirmModal } from '../ConfirmModal'

const METER_MAX = 45   // kJ mol⁻¹ at the right-hand end of the attraction meter
const FORCE_COLORS = { London: '#f5e6a8', 'dipole–dipole': '#f0913a', 'hydrogen bonds': '#4fd1c5' }

// The intermolecular forces lab (London Dispersion Forces): a close-up of
// two molecules with every electron, plus the boiling points that follow.
// Scenario config: src/modules/intermolecular-forces/reactions/london-dispersion.js
export function IMFLabPage({ reaction, module, pendingSwitch, onConfirmSwitch, onCancelSwitch }) {
  const [setId, setSetId] = useState(reaction.sets[0].id)
  const [selected, setSelected] = useState(() => Object.fromEntries(reaction.sets.map(s => [s.id, s.molecules[0].id])))
  const [tempC, setTempC] = useState(reaction.temperature.default)
  const [show, setShow] = useState({ dots: true, cloud: true, labels: true, lines: true })
  const [paused, setPaused] = useState(true)
  const [speed, setSpeed] = useState(1)   // 0.1 = ten times slower
  const [angle, setAngle] = useState(0)   // lower molecule: 0° side by side, 90° end on
  const [meter, setMeter] = useState(0)
  const [predictMode, setPredictMode] = useState(false)
  const [revealed, setRevealed] = useState(() => new Set())
  const [predictions, setPredictions] = useState({})
  const [guess, setGuess] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [showQuiz, setShowQuiz] = useState(false)

  const set = reaction.sets.find(s => s.id === setId)
  const molecule = set.molecules.find(m => m.id === selected[setId]) || set.molecules[0]
  const electrons = useMemo(() => buildMolecule(molecule.structure).electrons.length, [molecule])
  // Reveals and predictions are kept per set: pentane is a given reference
  // point among the isomers but still something to predict among the alkanes
  const keyOf = (id, sId = setId) => `${sId}:${id}`
  const isRevealed = (id) => !predictMode || revealed.has(keyOf(id))
  const known = isRevealed(molecule.id)
  const predictionsInSet = Object.fromEntries(set.molecules
    .filter(m => predictions[keyOf(m.id)] != null)
    .map(m => [m.id, predictions[keyOf(m.id)]]))
  const state = stateAt(molecule, tempC)

  const choose = (id) => {
    setSelected(s => ({ ...s, [setId]: id }))
    setGuess('')
  }

  // Predict mode hides boiling points until students have guessed them;
  // the first one or two of each set stay visible to start a trend
  const togglePredict = (on) => {
    setPredictMode(on)
    setFeedback(null)
    setGuess('')
    if (on) setRevealed(new Set(reaction.sets.flatMap(s => s.molecules.slice(0, s.trend ? 2 : 1).map(m => keyOf(m.id, s.id)))))
  }

  const check = (e) => {
    e.preventDefault()
    const value = Number(guess)
    if (guess === '' || !Number.isFinite(value)) return
    setPredictions(p => ({ ...p, [keyOf(molecule.id)]: value }))
    setRevealed(r => new Set(r).add(keyOf(molecule.id)))
    setFeedback({ name: molecule.name, predicted: value, actual: molecule.bp })
    setGuess('')
  }

  const annotation = pickAnnotation(reaction.annotations, { temperature: tempC }, {
    molecule,
    state: known ? state : null,
  })

  return (
    <div className="flex flex-col min-h-[calc(100vh-52px)]">
      <div className="flex flex-1 gap-0">

        {/* Left: the two molecules, explanation, boiling-point graph */}
        <div className="flex-1 p-4 flex flex-col gap-3 min-w-0">
          <div className="rounded-lg p-3" style={{ background: '#2a2f3a' }}>
            <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
              <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#6b7585' }}>
                Two {molecule.name.toLowerCase()} molecules up close
              </h3>
              <StateBadge state={known ? state : null} tempC={tempC} />
            </div>
            <div className="flex items-center gap-3 flex-wrap mb-2 text-xs" style={{ color: '#c8cdd8' }}>
              <Key swatch={<span className="inline-block rounded-full" style={{ width: 7, height: 7, background: '#f5d76e' }} />}>electron</Key>
              <Key swatch={<b style={{ color: '#ff7b7b' }}>δ−</b>}>more electrons</Key>
              <Key swatch={<b style={{ color: '#7fb4ff' }}>δ+</b>}>fewer electrons</Key>
              <Key swatch={<span style={{ color: '#f5e6a8', letterSpacing: 1 }}>┆</span>}>London force</Key>
              {molecule.forces.includes('dipole–dipole') && <Key swatch={<span style={{ color: '#f0913a' }}>│</span>}>dipole–dipole</Key>}
              {molecule.forces.includes('hydrogen bonds') && <Key swatch={<span style={{ color: '#4fd1c5' }}>┆</span>}>hydrogen bond</Key>}
            </div>
            <MoleculeView
              molecule={molecule}
              state={known ? state : 'liquid'}
              tempK={tempC + 273}
              show={show}
              paused={paused}
              speed={speed}
              angle={angle}
              onAttraction={setMeter}
            />
            <div className="flex items-center gap-3 flex-wrap mt-2">
              <button
                onClick={() => setPaused(p => !p)}
                className="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer border-0"
                style={{ background: paused ? '#3dba7e' : '#1e2535', color: paused ? '#fff' : '#e8eaf0', border: '1px solid #363c4a', minHeight: 40 }}
              >
                {paused ? '▶ Play' : '⏸ Freeze'}
              </button>
              <div className="flex items-center gap-1.5">
                <span className="text-xs mr-0.5" style={{ color: '#8a95a8' }}>Speed</span>
                <Chip active={speed === 1} onClick={() => setSpeed(1)}>1×</Chip>
                <Chip active={speed === 0.1} onClick={() => setSpeed(0.1)} title="Ten times slower">0.1×</Chip>
              </div>
              <span className="text-xs flex-1" style={{ color: '#6b7585', minWidth: 220 }}>
                {speed === 1
                  ? 'Already slowed down enormously: real electrons rearrange about a million billion times faster.'
                  : 'Ten times slower again, so you can follow each temporary dipole and the induced dipole it creates.'}
              </span>
            </div>
          </div>

          {annotation && (
            <div
              className="rounded-lg text-sm leading-relaxed"
              style={{ background: 'rgba(34, 38, 47, 0.95)', border: '1px solid rgba(79, 156, 240, 0.35)', color: '#e8eaf0', padding: '10px 14px' }}
            >
              {annotation}
            </div>
          )}

          <BPGraph
            set={set}
            selectedId={molecule.id}
            tempC={tempC}
            isRevealed={isRevealed}
            predictions={predictionsInSet}
            onSelect={choose}
          />
        </div>

        {/* Right: what to look at, and the numbers */}
        <div className="flex flex-col gap-4 p-4 overflow-y-auto" style={{ width: 360, minWidth: 320, borderLeft: '1px solid #363c4a', maxHeight: 'calc(100vh - 52px)' }}>
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-lg" style={{ background: '#1e2535' }}>
            {reaction.sets.map(s => (
              <button
                key={s.id}
                onClick={() => { setSetId(s.id); setGuess('') }}
                aria-pressed={s.id === setId}
                className="py-2 rounded-md text-sm font-semibold cursor-pointer border-0"
                style={{ background: s.id === setId ? '#4f9cf0' : 'transparent', color: s.id === setId ? '#fff' : '#8a95a8', minHeight: 36 }}
              >
                {s.label}
              </button>
            ))}
          </div>

          <Card title="Molecule">
            <div className="flex flex-wrap gap-1.5">
              {set.molecules.map(m => (
                <Chip key={m.id} active={m.id === molecule.id} onClick={() => choose(m.id)}>
                  {set.id === 'alkanes' || set.id === 'halogens' ? m.formula : m.name}
                </Chip>
              ))}
            </div>
            <div className="flex items-baseline justify-between gap-2 pt-1">
              <span className="text-lg font-bold" style={{ color: '#e8eaf0' }}>{molecule.name}</span>
              <span className="text-lg font-mono" style={{ color: '#c8cdd8' }}>{molecule.formula}</span>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
              <Fact label="Electrons" value={electrons} strong />
              <Fact label="Molar mass" value={`${molecule.mr.toFixed(1)} g mol⁻¹`} />
              <Fact label="Boiling point" value={known ? `${formatTemp(molecule.bp)} °C` : '?'} strong />
              <Fact label="Melting point" value={known ? `${formatTemp(molecule.mp)} °C` : '?'} />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs" style={{ color: '#6b7585' }}>Forces between molecules:</span>
              {molecule.forces.map(f => (
                <span key={f} className="px-2 py-0.5 rounded text-xs font-semibold" style={{ background: '#1e2535', color: FORCE_COLORS[f], border: `1px solid ${FORCE_COLORS[f]}55` }}>
                  {f}
                </span>
              ))}
            </div>
          </Card>

          <Card title="Attraction between the two molecules">
            <div className="relative rounded-full overflow-hidden" style={{ height: 14, background: '#1e2535' }}>
              <div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ width: `${Math.min(100, (meter / METER_MAX) * 100)}%`, background: 'linear-gradient(90deg, #f5e6a8, #f0913a)', transition: 'width 0.15s linear' }}
              />
              <div className="absolute inset-y-0" style={{ left: `${(molecule.dHvap / METER_MAX) * 100}%`, width: 3, background: '#e8eaf0' }} />
            </div>
            <div className="flex justify-between text-xs" style={{ color: '#6b7585' }}>
              <span>weak</span>
              <span>strong</span>
            </div>
            <Hint>
              The bar flickers as temporary dipoles come and go; the white mark is its average with the molecules side by side.
              DP: that average matches the energy needed to separate the molecules, ΔH<sub>vap</sub> = {molecule.dHvap.toFixed(1)} kJ mol⁻¹.
            </Hint>
          </Card>

          <Card title="Turn the lower molecule" right={
            <span className="text-sm font-mono font-semibold" style={{ color: '#c8cdd8' }}>{angle}°</span>
          }>
            <input
              type="range"
              min={0}
              max={90}
              step={5}
              value={angle}
              onChange={(e) => setAngle(Number(e.target.value))}
              className="w-full"
              style={{ minHeight: 32 }}
              aria-label="Angle of the lower molecule"
            />
            <div className="flex justify-between text-xs" style={{ color: '#6b7585' }}>
              <span>side by side</span>
              <span>end on</span>
            </div>
            <Hint>
              Turned, the molecules touch over a shorter distance, so fewer induced dipoles can line up and the attraction drops.
              In a liquid, molecules meet at every angle. Compare a long chain with a ball-shaped molecule.
            </Hint>
          </Card>

          <Card title="Temperature" right={
            <span className="text-sm font-mono font-semibold" style={{ color: '#f0913a' }}>{tempC} °C</span>
          }>
            <input
              type="range"
              min={reaction.temperature.min}
              max={reaction.temperature.max}
              step={1}
              value={tempC}
              onChange={(e) => setTempC(Number(e.target.value))}
              className="w-full"
              style={{ minHeight: 32 }}
              aria-label="Temperature"
            />
            <Hint>Hotter molecules move faster. Above the boiling point they move too fast for the forces between them to hold them together.</Hint>
          </Card>

          <Card title="Show">
            <Switch on={show.dots} onChange={(v) => setShow(s => ({ ...s, dots: v }))} label="Electrons (dots)" />
            <Switch on={show.cloud} onChange={(v) => setShow(s => ({ ...s, cloud: v }))} label="Electron cloud" />
            <Switch on={show.labels} onChange={(v) => setShow(s => ({ ...s, labels: v }))} label="δ+ and δ− labels" />
            <Switch on={show.lines} onChange={(v) => setShow(s => ({ ...s, lines: v }))} label="Attraction lines" />
          </Card>

          <Card title="Predict, then check">
            <Switch on={predictMode} onChange={togglePredict} label="Predict boiling points first" />
            {predictMode && !known && (
              <form onSubmit={check} className="space-y-2">
                <p className="text-sm" style={{ color: '#e8eaf0' }}>What is the boiling point of {molecule.name.toLowerCase()}?</p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="1"
                    value={guess}
                    onChange={(e) => setGuess(e.target.value)}
                    placeholder="°C"
                    aria-label="Predicted boiling point"
                    className="w-24 px-2 rounded-md text-sm font-mono"
                    style={{ background: '#1e2535', color: '#e8eaf0', border: '1px solid #454d5e', minHeight: 36 }}
                  />
                  <button type="submit" className="px-3 rounded-md text-sm font-semibold cursor-pointer border-0"
                    style={{ background: '#f0c040', color: '#1a1d24', minHeight: 36 }}>
                    Check
                  </button>
                  <button type="button" onClick={() => setRevealed(r => new Set(r).add(keyOf(molecule.id)))}
                    className="px-3 rounded-md text-sm cursor-pointer border-0"
                    style={{ background: '#1e2535', color: '#c8cdd8', border: '1px solid #363c4a', minHeight: 36 }}>
                    Show me
                  </button>
                </div>
                <Hint>Use the graph: how much does the boiling point change from one molecule to the next?</Hint>
              </form>
            )}
            {predictMode && known && !feedback && (
              <Hint>Pick a molecule whose boiling point is still a “?” and predict it.</Hint>
            )}
            {feedback && <Feedback {...feedback} />}
          </Card>
        </div>
      </div>

      <div className="px-4 pb-4">
        <StatusBar
          items={[
            { label: 'Molecule', value: molecule.formula, color: '#e8eaf0' },
            { label: 'Electrons', value: electrons, color: '#f5d76e' },
            { label: 'Boiling point', value: known ? `${formatTemp(molecule.bp)} °C` : '?', color: '#f0913a' },
            { label: `At ${tempC} °C`, value: known ? state : '?', color: known ? STATE_COLORS[state] : '#6b7585' },
          ]}
          onTakeQuiz={() => setShowQuiz(true)}
        />
      </div>

      <QuizModal
        isOpen={showQuiz}
        quiz={module.getQuiz(reaction.id)}
        reactionId={reaction.id}
        moduleName={module.name}
        onClose={() => setShowQuiz(false)}
      />

      <ConfirmModal
        isOpen={!!pendingSwitch}
        title="Switch reaction?"
        message={`Switching to ${pendingSwitch?.name || ''} will reset the simulation completely.`}
        onConfirm={onConfirmSwitch}
        onCancel={onCancelSwitch}
      />
    </div>
  )
}

// −0.5 → "−0.5", −161.5 → "−162", 125.6 → "126" (halves round away from
// zero, as in data tables; proper minus sign)
function formatTemp(t) {
  const v = Math.abs(t) < 1 ? t.toFixed(1) : String(Math.sign(t) * Math.round(Math.abs(t)))
  return v.replace('-', '−')
}

// First matching annotation, else the 'always' one. Text may be a function.
function pickAnnotation(annotations, vars, stats) {
  let fallback = null
  for (const ann of annotations || []) {
    if (ann.condition === 'always') {
      fallback = fallback || ann
      continue
    }
    if (typeof ann.condition === 'function' && ann.condition(vars, stats)) {
      return typeof ann.text === 'function' ? ann.text(vars, stats) : ann.text
    }
  }
  return fallback?.text ?? null
}

function StateBadge({ state, tempC }) {
  const color = state ? STATE_COLORS[state] : '#6b7585'
  return (
    <span className="px-2.5 py-1 rounded-md text-xs font-semibold" style={{ background: '#1e2535', color, border: `1px solid ${color}66` }}>
      {state ? `${state[0].toUpperCase()}${state.slice(1)} at ${tempC} °C` : `State at ${tempC} °C: predict first`}
    </span>
  )
}

function Key({ swatch, children }) {
  return <span className="flex items-center gap-1.5">{swatch}{children}</span>
}

function Fact({ label, value, strong }) {
  return (
    <div className="flex flex-col">
      <span style={{ color: '#6b7585' }}>{label}</span>
      <span className="font-mono" style={{ color: '#e8eaf0', fontWeight: strong ? 700 : 500, fontSize: 13 }}>{value}</span>
    </div>
  )
}

function Feedback({ name, predicted, actual }) {
  const off = Math.abs(predicted - actual)
  const verdict = off <= 10 ? 'Spot on!' : off <= 25 ? 'Close!' : off <= 50 ? 'Not bad.' : 'Quite far off: look at how the points rise on the graph.'
  return (
    <div className="text-sm rounded-md p-2" style={{ background: '#1e2535', color: '#e8eaf0' }}>
      {name}: you predicted <b>{formatTemp(predicted)} °C</b>, it boils at <b>{formatTemp(actual)} °C</b> (off by {Math.round(off)} °C). {verdict}
    </div>
  )
}
