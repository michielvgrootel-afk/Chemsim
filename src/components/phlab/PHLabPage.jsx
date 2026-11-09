import React, { useEffect, useState } from 'react'
import { usePHLab, runLabel } from '../../hooks/usePHLab'
import { indicatorColor, universalColor } from '../../engine/phLab'
import { PHGraph } from './PHGraph'
import { Beaker } from './Beaker'
import { FreeLabControls, TitrationControls } from './LabControls'
import { DataTable } from './DataTable'
import { NumbersPanel } from './NumbersPanel'
import { Card, Chip, Switch, Hint } from './ui'
import { concText, volText, formatSci } from './format'
import { StatusBar } from '../StatusBar'
import { QuizModal } from '../QuizModal'
import { ConfirmModal } from '../ConfirmModal'

const TITRANT_IN_BURETTE = 'rgba(170, 200, 235, 0.55)'

// The pH lab (pH Scale Sandbox): a graph-first page instead of a particle
// simulation. Scenario config: src/modules/acids-bases/reactions/ph-scale.js
export function PHLabPage({ reaction, module, pendingSwitch, onConfirmSwitch, onCancelSwitch }) {
  const { lab, actions } = usePHLab(reaction)
  const [xMode, setXMode] = useState('time')
  const [showQuiz, setShowQuiz] = useState(false)
  const [showNumbers, setShowNumbers] = useState(false)
  const [predictMode, setPredictMode] = useState(false)
  const [pending, setPending] = useState(null)     // a step waiting for a prediction
  const [feedback, setFeedback] = useState(null)   // the last prediction vs the result
  const [choice, setChoice] = useState({ substance: reaction.substances[0].id, conc: 0.1 })

  const a = lab.analysis
  const byId = (id) => reaction.substances.find(s => s.id === id)
  const indicator = reaction.indicators.find(i => i.id === lab.indicatorId)
  const titrantRate = lab.flow?.kind === 'titrant' ? lab.flow.rate : 0
  const pouring = !!lab.flow && lab.flow.kind !== 'titrant'
  const notice = lab.notice && lab.notice.until > performance.now() ? lab.notice.text : null
  // The live end of the current curve, so a time graph runs on to "now"
  const points = a ? [...lab.points, { t: lab.t, v: lab.vAdded, pH: a.pH }] : lab.points

  // Steps go through here: in predict mode they wait for a prediction first
  const runStep = (text, perform) => {
    if (predictMode) {
      setFeedback(null)
      setPending({ text, perform })
    } else {
      perform(null)
    }
  }

  const freeStep = (kind, amount) => {
    const s = byId(choice.substance)
    const text = {
      add: () => `adding ${volText(amount)} of ${concText(choice.conc)} ${s.formula}`,
      water: () => `adding ${volText(amount)} of water`,
      pourOut: () => `pouring out ${volText(amount)}`,
      evaporate: () => `evaporating ${volText(amount)} of water`,
    }[kind]()
    runStep(text, (predicted) => {
      if (kind === 'add') actions.add(choice.substance, choice.conc, amount, predicted)
      else if (kind === 'water') actions.addWater(amount, predicted)
      else if (kind === 'pourOut') actions.pourOut(amount, predicted)
      else actions.evaporate(amount, predicted)
    })
  }

  const buretteStep = (volume, label) => {
    runStep(label.replace(/^Added/, 'adding'), (predicted) => actions.titrant(volume, label, predicted))
  }

  const check = (value) => {
    const predicted = Number(value)
    if (value === '' || !Number.isFinite(predicted) || !pending) return
    const before = lab.predictions.length
    pending.perform(predicted)
    if (lab.predictions.length > before) {
      const p = lab.predictions[lab.predictions.length - 1]
      setFeedback({ text: pending.text, predicted, actual: p.actual })
    }
    setPending(null)
  }

  const switchMode = (mode) => {
    setPending(null)
    setFeedback(null)
    actions.setMode(mode)
  }

  const annotation = pickAnnotation(reaction.annotations, { temperature: lab.tempC, mode: lab.mode }, {
    ph: a?.pH,
    neutralPH: a?.neutralPH,
    KwText: a ? formatSci(a.Kw) : '',
    mode: lab.mode,
    lastAction: lab.lastAction,
    hasAcid: reaction.substances.some(s => s.type === 'acid' && lab.beaker.moles[s.id] > 0),
    hasBase: reaction.substances.some(s => s.type === 'base' && lab.beaker.moles[s.id] > 0),
    analyte: byId(lab.setup.analyte.substance),
    titrant: byId(lab.setup.titrant.substance),
    passedHalf: !!lab.markers.half,
    passedEq: !!lab.markers.eq,
    halfPH: lab.markers.half?.pH,
    eqPH: lab.markers.eq?.pH,
  })

  return (
    <div className="flex flex-col min-h-[calc(100vh-52px)]">
      <div className="flex flex-1 gap-0">

        {/* Left: graph, explanation, clock controls, data table */}
        <div className="flex-1 p-4 flex flex-col gap-3 min-w-0">
          <PHGraph
            points={points}
            ghosts={lab.ghosts}
            xMode={xMode}
            onXModeChange={setXMode}
            neutralPH={a?.neutralPH ?? 7}
            indicator={indicator}
            markers={lab.markers}
            predictions={lab.predictions}
            currentLabel={`Run ${lab.run}: ${runLabel(lab)}`}
            onKeepRun={actions.keepRun}
            onClearRuns={actions.clearRuns}
          />

          {annotation && (
            <div
              className="rounded-lg text-sm leading-relaxed"
              style={{ background: 'rgba(34, 38, 47, 0.95)', border: '1px solid rgba(79, 156, 240, 0.35)', color: '#e8eaf0', padding: '10px 14px' }}
            >
              {annotation}
            </div>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            <PageButton
              primary={!lab.running}
              onClick={lab.running ? actions.pause : actions.resume}
            >
              {lab.running ? '⏸ Pause' : lab.t === 0 ? '▶ Start clock' : '▶ Resume'}
            </PageButton>
            <PageButton onClick={() => { setPending(null); setFeedback(null); actions.reset() }}>↺ Reset</PageButton>
            <PageButton onClick={() => { setPending(null); actions.undo() }}>↶ Undo</PageButton>
            {notice && <span className="text-sm" style={{ color: '#f0c040' }}>{notice}</span>}
          </div>

          <DataTable rows={lab.rows} />
        </div>

        {/* Right: beaker, mode, controls, settings */}
        <div className="flex flex-col gap-4 p-4 overflow-y-auto" style={{ width: 360, minWidth: 320, borderLeft: '1px solid #363c4a', maxHeight: 'calc(100vh - 52px)' }}>
          <div className="rounded-lg p-3" style={{ background: '#2a2f3a' }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6b7585' }}>pH meter</span>
              <span className="text-3xl font-mono font-bold" style={{ color: a ? universalColor(a.pH) : '#6b7585' }}>
                {a ? a.pH.toFixed(2) : '—'}
              </span>
            </div>
            <Beaker
              volume={lab.beaker.volume}
              capacity={reaction.beaker.capacity}
              color={a ? indicatorColor(indicator, a.pH) : 'transparent'}
              burette={lab.mode === 'titration' ? { delivered: lab.delivered, rate: titrantRate, color: TITRANT_IN_BURETTE } : null}
            />
            <div className="flex justify-between text-xs mt-1" style={{ color: '#8a95a8' }}>
              <span>{lab.beaker.volume.toFixed(1)} cm³ in the {lab.mode === 'titration' ? 'flask' : 'beaker'}</span>
              <span>{indicator.name}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-lg" style={{ background: '#1e2535' }}>
            {[['free', 'Free lab'], ['titration', 'Titration']].map(([mode, label]) => (
              <button
                key={mode}
                onClick={() => switchMode(mode)}
                aria-pressed={lab.mode === mode}
                className="py-2 rounded-md text-sm font-semibold cursor-pointer border-0"
                style={{ background: lab.mode === mode ? '#4f9cf0' : 'transparent', color: lab.mode === mode ? '#fff' : '#8a95a8', minHeight: 36 }}
              >
                {label}
              </button>
            ))}
          </div>

          {lab.mode === 'free' ? (
            <FreeLabControls
              config={reaction}
              choice={choice}
              onChoice={setChoice}
              onStep={freeStep}
              onPourStart={() => actions.startPour(choice.substance === 'water' ? null : choice.substance, choice.conc)}
              onPourEnd={actions.stopPour}
              pouring={pouring}
            />
          ) : (
            <TitrationControls
              config={reaction}
              setup={lab.setup}
              onSetup={(change) => { setPending(null); setFeedback(null); actions.setSetup(change) }}
              delivered={lab.delivered}
              tapRate={titrantRate}
              onTap={actions.setTap}
              onStep={buretteStep}
            />
          )}

          <PredictPanel
            on={predictMode}
            onToggle={(on) => { setPredictMode(on); setPending(null); setFeedback(null) }}
            pending={pending}
            onCheck={check}
            onCancel={() => setPending(null)}
            feedback={feedback}
            predictions={lab.predictions}
          />

          <Card title="Indicator">
            <div className="flex flex-wrap gap-1.5">
              {reaction.indicators.map(ind => (
                <Chip key={ind.id} active={ind.id === indicator.id} onClick={() => actions.setIndicator(ind.id)}>
                  {ind.name}
                </Chip>
              ))}
            </div>
            <Hint>
              {indicator.low != null
                ? `${indicator.name} changes colour between pH ${indicator.low} and ${indicator.high} (shaded on the graph).`
                : 'Universal indicator shows the whole pH range: red (acidic) through green (neutral) to violet (basic).'}
            </Hint>
          </Card>

          <Card title="Temperature" right={
            <span className="text-sm font-mono font-semibold" style={{ color: '#f0913a' }}>{lab.tempC} °C</span>
          }>
            <input
              type="range"
              min={reaction.temperature.min}
              max={reaction.temperature.max}
              step={1}
              value={lab.tempC}
              onChange={(e) => actions.setTemperature(Number(e.target.value))}
              className="w-full"
              style={{ minHeight: 32 }}
              aria-label="Temperature"
            />
            {a && <Hint>Neutral water at {lab.tempC} °C has pH {a.neutralPH.toFixed(2)}.</Hint>}
          </Card>

          <Card>
            <Switch on={showNumbers} onChange={setShowNumbers} label="Show the numbers" />
          </Card>
          {showNumbers && (
            <NumbersPanel
              analysis={a}
              tempC={lab.tempC}
              mode={lab.mode}
              setup={lab.setup}
              delivered={lab.delivered}
              substances={reaction.substances}
            />
          )}
        </div>
      </div>

      <div className="px-4 pb-4">
        <StatusBar
          labStats={{ ph: a?.pH, color: a ? universalColor(a.pH) : '#6b7585', volume: lab.beaker.volume, tempC: lab.tempC, elapsed: lab.t }}
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
        message={`Switching to ${pendingSwitch?.name || ''} will reset the simulation completely. Your current graph and data table will be lost.`}
        onConfirm={onConfirmSwitch}
        onCancel={onCancelSwitch}
      />
    </div>
  )
}

// First matching annotation, else the 'always' one. Text may be a function.
function pickAnnotation(annotations, vars, stats) {
  let fallback = null
  for (const ann of annotations || []) {
    if (ann.condition === 'always') {
      fallback = fallback || ann
      continue
    }
    if (typeof ann.condition === 'function' && ann.condition(vars, stats)) return textOf(ann, vars, stats)
  }
  return fallback ? textOf(fallback, vars, stats) : null
}

function textOf(ann, vars, stats) {
  return typeof ann.text === 'function' ? ann.text(vars, stats) : ann.text
}

function PageButton({ primary, children, ...props }) {
  return (
    <button
      {...props}
      className="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer border-0 transition-colors"
      style={{ background: primary ? '#3dba7e' : '#2a2f3a', color: primary ? '#fff' : '#e8eaf0', border: '1px solid #363c4a', minHeight: 44 }}
    >
      {children}
    </button>
  )
}

function PredictPanel({ on, onToggle, pending, onCheck, onCancel, feedback, predictions }) {
  const [value, setValue] = useState('')
  useEffect(() => setValue(''), [pending])
  const meanError = predictions.length
    ? predictions.reduce((sum, p) => sum + Math.abs(p.predicted - p.actual), 0) / predictions.length
    : 0

  return (
    <Card title="Predict, then check">
      <Switch on={on} onChange={onToggle} label="Predict before each step" />
      {on && !pending && !feedback && (
        <Hint>Click a step (add, pour out, evaporate or a burette step) and predict the pH first. Hold-to-pour and the open tap run without predictions.</Hint>
      )}
      {pending && (
        <form onSubmit={(e) => { e.preventDefault(); onCheck(value) }} className="space-y-2">
          <p className="text-sm" style={{ color: '#e8eaf0' }}>What will the pH be after {pending.text}?</p>
          <div className="flex gap-2">
            <input
              type="number"
              step="0.1"
              min="-1"
              max="15"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoFocus
              placeholder="pH"
              aria-label="Predicted pH"
              className="w-20 px-2 rounded-md text-sm font-mono"
              style={{ background: '#1e2535', color: '#e8eaf0', border: '1px solid #454d5e', minHeight: 36 }}
            />
            <button type="submit" className="px-3 rounded-md text-sm font-semibold cursor-pointer border-0"
              style={{ background: '#f0c040', color: '#1a1d24', minHeight: 36 }}>
              Check
            </button>
            <button type="button" onClick={onCancel} className="px-3 rounded-md text-sm cursor-pointer border-0"
              style={{ background: '#1e2535', color: '#c8cdd8', border: '1px solid #363c4a', minHeight: 36 }}>
              Cancel
            </button>
          </div>
        </form>
      )}
      {feedback && <Feedback {...feedback} />}
      {predictions.length > 0 && (
        <Hint>{predictions.length} {predictions.length === 1 ? 'prediction' : 'predictions'} · average error {meanError.toFixed(2)} pH units</Hint>
      )}
    </Card>
  )
}

function Feedback({ text, predicted, actual }) {
  const off = Math.abs(predicted - actual)
  const verdict = off <= 0.2 ? 'Spot on!'
    : off <= 0.5 ? 'Close!'
    : off <= 1 ? 'Not bad.'
    : 'Quite far off. Each pH unit is a 10× change in [H⁺].'
  return (
    <div className="text-sm rounded-md p-2" style={{ background: '#1e2535', color: '#e8eaf0' }}>
      After {text}: you predicted <b>{predicted.toFixed(1)}</b>, the pH is <b>{actual.toFixed(2)}</b> (off by {off.toFixed(2)}). {verdict}
    </div>
  )
}
