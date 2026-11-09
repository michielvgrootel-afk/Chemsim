// State and actions for the pH lab page (pH Scale Sandbox). The whole lab
// lives in one mutable object that a requestAnimationFrame clock advances;
// React re-renders after every action and ~10× a second while the clock runs.
//
// A "run" is one experiment: its graph points, predictions and data-table
// rows. "Keep run" turns the current run into a faded comparison curve and
// starts a new one; Reset starts the current run again.

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  analyse, addSolution, addWater, pourOut, evaporate, titrationBeaker, equivalenceVolume,
} from '../engine/phLab'
import { concText, volText } from '../components/phlab/format'

const RENDER_MS = 100       // re-render interval while the clock runs
const SAMPLE_DT = 0.25      // s between graph points while liquid flows…
const SAMPLE_DPH = 0.02     // …or sooner once the pH has moved this much
const MAX_KEPT_RUNS = 4
const MAX_UNDO = 50
const NOTICE_MS = 3500
export const RUN_COLORS = ['#f0913a', '#3dba7e', '#4f9cf0', '#e05555']

export function usePHLab(config) {
  const labRef = useRef(null)
  if (labRef.current === null) labRef.current = newLab(config)
  const [, setVersion] = useState(0)
  const rerender = useCallback(() => setVersion(v => v + 1), [])

  // The lab clock: advances time and any flowing liquid while running
  useEffect(() => {
    let raf
    let last = performance.now()
    let lastRender = 0
    const frame = (now) => {
      const lab = labRef.current
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      if (lab.running) {
        lab.t += dt
        if (lab.flow) advanceFlow(lab, dt)
        if (now - lastRender >= RENDER_MS) {
          lastRender = now
          setVersion(v => v + 1)
        }
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [])

  // A temperature row is written once the slider has rested for a moment
  const tempRowTimer = useRef(null)
  useEffect(() => () => clearTimeout(tempRowTimer.current), [])

  const actions = useRef(null)
  if (actions.current === null) {
    // Every action changes the lab, then re-renders (and once more when a
    // notice it showed has expired)
    const act = (fn) => (...args) => {
      const lab = labRef.current
      const shown = lab.notice
      const result = fn(lab, ...args)
      if (lab.notice && lab.notice !== shown) setTimeout(rerender, NOTICE_MS + 50)
      rerender()
      return result
    }
    actions.current = {
      add: act(addStep),
      addWater: act(waterStep),
      pourOut: act(pourOutStep),
      evaporate: act(evaporateStep),
      startPour: act((lab, substance, conc) => startFlow(lab, substance
        ? { kind: 'solution', substance, conc, rate: lab.config.pourRate }
        : { kind: 'water', rate: lab.config.pourRate })),
      stopPour: act(stopFlow),
      titrant: act(titrantStep),
      setTap: act((lab, rate) => {
        if (rate > 0) startFlow(lab, { kind: 'titrant', rate })
        else stopFlow(lab)
      }),
      undo: act(undo),
      reset: act((lab) => startRun(lab)),
      pause: act((lab) => { stopFlow(lab); lab.running = false }),
      resume: act((lab) => { lab.running = true }),
      setMode: act((lab, mode) => {
        if (lab.mode === mode) return
        lab.mode = mode
        startRun(lab)
      }),
      setSetup: act(setSetup),
      setIndicator: act((lab, id) => { lab.indicatorId = id }),
      setTemperature: act((lab, tempC) => {
        setTemperature(lab, tempC)
        clearTimeout(tempRowTimer.current)
        tempRowTimer.current = setTimeout(() => {
          const l = labRef.current
          addRow(l, `Temperature set to ${l.tempC} °C`)
          rerender()
        }, 600)
      }),
      keepRun: act(keepRun),
      clearRuns: act((lab) => { lab.ghosts = [] }),
    }
  }

  return { lab: labRef.current, actions: actions.current }
}

// ---------- Lab state ----------

function newLab(config) {
  const lab = {
    config,
    mode: 'free',
    setup: {
      analyte: { ...config.titration.analyte },
      titrant: { ...config.titration.titrant },
    },
    tempC: config.temperature?.default ?? 25,
    indicatorId: config.indicators?.[0]?.id,
    run: 1,
    rows: [],
    ghosts: [],
    notice: null,
  }
  startRun(lab)
  return lab
}

// Start (or restart) the current run from its starting beaker
function startRun(lab) {
  const { config } = lab
  lab.running = false
  lab.flow = null
  lab.t = 0
  lab.vAdded = 0          // cm³ of liquid added this run (the volume x-axis)
  lab.delivered = 0       // cm³ from the burette (titration)
  lab.points = []
  lab.predictions = []
  lab.history = []
  lab.markers = { half: null, eq: null }
  lab.lastAction = null
  lab.used = []
  lab.rows = lab.rows.filter(r => r.run !== lab.run)
  if (lab.mode === 'titration') {
    lab.beaker = titrationBeaker(lab.setup, 0)
    lab.vEq = equivalenceVolume(lab.setup)
    lab.nextMark = config.titration.rowEvery
  } else {
    lab.beaker = { volume: config.beaker.startVolume, moles: {} }
  }
  refresh(lab)
  addPoint(lab)
  addRow(lab, startText(lab))
}

function refresh(lab) {
  lab.analysis = analyse(lab.beaker, lab.config.substances, lab.tempC)
}

function substance(lab, id) {
  return lab.config.substances.find(s => s.id === id)
}

function notice(lab, text) {
  lab.notice = { text, until: performance.now() + NOTICE_MS }
}

function startText(lab) {
  if (lab.mode === 'titration') {
    const { analyte, titrant } = lab.setup
    return `Start: ${volText(analyte.volume)} of ${concText(analyte.conc)} ${substance(lab, analyte.substance).formula} in the flask; burette: ${concText(titrant.conc)} ${substance(lab, titrant.substance).formula}`
  }
  return `Start: ${volText(lab.config.beaker.startVolume)} of distilled water`
}

// ---------- Graph points, data-table rows, undo ----------

function addPoint(lab) {
  const pH = lab.analysis?.pH
  if (pH == null) return
  const last = lab.points[lab.points.length - 1]
  if (last && last.t === lab.t && last.v === lab.vAdded && Math.abs(last.pH - pH) < 1e-9) return
  lab.points.push({ t: lab.t, v: lab.vAdded, pH })
}

// While liquid flows, keep a point every SAMPLE_DT or when the pH moves
function sample(lab) {
  const last = lab.points[lab.points.length - 1]
  const pH = lab.analysis?.pH
  if (pH == null) return
  if (!last || lab.t - last.t >= SAMPLE_DT || Math.abs(pH - last.pH) >= SAMPLE_DPH) addPoint(lab)
}

function addRow(lab, action, extra = {}) {
  lab.rows.push({
    run: lab.run,
    t: lab.t,
    action,
    added: lab.vAdded,
    volume: lab.beaker.volume,
    pH: lab.analysis?.pH ?? null,
    h: lab.analysis?.h ?? null,
    predicted: null,
    ...extra,
  })
}

function saveUndo(lab) {
  lab.history.push({
    beaker: lab.beaker,
    vAdded: lab.vAdded,
    delivered: lab.delivered,
    points: lab.points.length,
    rows: lab.rows.length,
    predictions: lab.predictions.length,
    markers: { ...lab.markers },
    nextMark: lab.nextMark,
    lastAction: lab.lastAction,
    used: lab.used.length,
  })
  if (lab.history.length > MAX_UNDO) lab.history.shift()
}

// Undo takes the last step off the beaker, the graph and the table
function undo(lab) {
  if (lab.flow) stopFlow(lab)
  const h = lab.history.pop()
  if (!h) {
    notice(lab, 'Nothing to undo.')
    return
  }
  lab.beaker = h.beaker
  lab.vAdded = h.vAdded
  lab.delivered = h.delivered
  lab.points.length = h.points
  lab.rows.length = h.rows
  lab.predictions.length = h.predictions
  lab.markers = h.markers
  lab.nextMark = h.nextMark
  lab.lastAction = h.lastAction
  lab.used.length = h.used
  refresh(lab)
}

function markUsed(lab, label) {
  if (!lab.used.includes(label)) lab.used.push(label)
}

// ---------- Step actions (one click = one change) ----------

// Apply one change at the current moment: the graph gets the point just
// before and just after it, so a time graph shows a vertical jump
function step(lab, kind, text, change, predicted) {
  lab.running = true
  saveUndo(lab)
  addPoint(lab)
  const before = lab.delivered
  change(lab)
  refresh(lab)
  addPoint(lab)
  if (lab.mode === 'titration') {
    passMarkers(lab, before, lab.t, lab.t)
    while (lab.nextMark <= lab.delivered + 1e-9) lab.nextMark += lab.config.titration.rowEvery
  }
  const pH = lab.analysis?.pH
  if (predicted != null && pH != null) {
    lab.predictions.push({ t: lab.t, v: lab.vAdded, predicted, actual: pH })
  }
  addRow(lab, text, { predicted: predicted ?? null })
  lab.lastAction = kind
}

function room(lab) {
  return lab.config.beaker.capacity - lab.beaker.volume
}

function addStep(lab, substanceId, conc, volume, predicted) {
  const v = Math.min(volume, room(lab))
  if (v <= 1e-9) return notice(lab, 'The beaker is full: pour some out first.')
  const s = substance(lab, substanceId)
  step(lab, 'add', `Added ${volText(v)} of ${concText(conc)} ${s.formula}`, (l) => {
    l.beaker = addSolution(l.beaker, substanceId, conc, v)
    l.vAdded += v
    markUsed(l, `${s.formula} ${concText(conc)}`)
  }, predicted)
  if (v < volume - 1e-9) notice(lab, `The beaker is full: only ${volText(v)} fitted.`)
}

function waterStep(lab, volume, predicted) {
  const v = Math.min(volume, room(lab))
  if (v <= 1e-9) return notice(lab, 'The beaker is full: pour some out first.')
  step(lab, 'water', `Added ${volText(v)} of water`, (l) => {
    l.beaker = addWater(l.beaker, v)
    l.vAdded += v
    markUsed(l, 'water')
  }, predicted)
  if (v < volume - 1e-9) notice(lab, `The beaker is full: only ${volText(v)} fitted.`)
}

function pourOutStep(lab, volume, predicted) {
  const v = Math.min(volume, lab.beaker.volume - lab.config.beaker.minVolume)
  if (v <= 1e-9) return notice(lab, `Keep at least ${volText(lab.config.beaker.minVolume)} in the beaker.`)
  step(lab, 'pourOut', `Poured out ${volText(v)}`, (l) => {
    l.beaker = pourOut(l.beaker, v)
  }, predicted)
}

function evaporateStep(lab, volume, predicted) {
  const v = Math.min(volume, lab.beaker.volume - lab.config.beaker.minVolume)
  if (v <= 1e-9) return notice(lab, `Keep at least ${volText(lab.config.beaker.minVolume)} in the beaker.`)
  step(lab, 'evaporate', `Evaporated ${volText(v)} of water`, (l) => {
    l.beaker = evaporate(l.beaker, v)
  }, predicted)
}

function titrantStep(lab, volume, text, predicted) {
  const v = Math.min(volume, room(lab))
  if (v <= 1e-9) return notice(lab, 'The flask is full.')
  step(lab, 'titrant', text, (l) => {
    l.delivered += v
    l.vAdded = l.delivered
    l.beaker = titrationBeaker(l.setup, l.delivered)
  }, predicted)
}

// ---------- Flowing liquid (hold to pour, burette tap) ----------

function startFlow(lab, flow) {
  if (lab.flow) stopFlow(lab)
  lab.running = true
  saveUndo(lab)
  addPoint(lab)
  lab.flow = { ...flow, poured: 0 }
}

function stopFlow(lab) {
  const f = lab.flow
  if (!f) return
  lab.flow = null
  addPoint(lab)
  if (f.poured <= 1e-9) {
    lab.history.pop()   // nothing went in: nothing to undo
    return
  }
  if (f.kind === 'titrant') {
    lab.lastAction = 'titrant'
    addRow(lab, `Tap closed at ${lab.delivered.toFixed(2)} cm³`)
  } else if (f.kind === 'water') {
    lab.lastAction = 'water'
    markUsed(lab, 'water')
    addRow(lab, `Poured in ${volText(f.poured)} of water`)
  } else {
    const s = substance(lab, f.substance)
    lab.lastAction = 'add'
    markUsed(lab, `${s.formula} ${concText(f.conc)}`)
    addRow(lab, `Poured in ${volText(f.poured)} of ${concText(f.conc)} ${s.formula}`)
  }
}

function advanceFlow(lab, dt) {
  const f = lab.flow
  const dv = Math.min(f.rate * dt, room(lab))
  if (dv <= 1e-9) {
    stopFlow(lab)
    notice(lab, lab.mode === 'titration' ? 'The flask is full.' : 'The beaker is full: pour some out first.')
    return
  }
  const before = lab.delivered
  if (f.kind === 'titrant') {
    lab.delivered += dv
    lab.vAdded = lab.delivered
    lab.beaker = titrationBeaker(lab.setup, lab.delivered)
  } else if (f.kind === 'water') {
    lab.beaker = addWater(lab.beaker, dv)
    lab.vAdded += dv
  } else {
    lab.beaker = addSolution(lab.beaker, f.substance, f.conc, dv)
    lab.vAdded += dv
  }
  f.poured += dv
  refresh(lab)
  if (f.kind === 'titrant') {
    passMarkers(lab, before, lab.t - dt, lab.t)
    buretteRows(lab, before, lab.t - dt, lab.t)
  }
  sample(lab)
}

// ---------- Titration: equivalence markers and burette readings ----------

// Analysis of the flask at an exact burette volume (for markers and rows)
function flaskAt(lab, delivered) {
  const beaker = titrationBeaker(lab.setup, delivered)
  return { beaker, analysis: analyse(beaker, lab.config.substances, lab.tempC) }
}

// Time at which the burette reached `v`, between two frame times
function timeAt(v, before, after, t0, t1) {
  return after > before ? t0 + ((v - before) / (after - before)) * (t1 - t0) : t1
}

function isWeakAnalyte(lab) {
  return !substance(lab, lab.setup.analyte.substance).strong
}

function passMarkers(lab, before, t0, t1) {
  const after = lab.delivered
  const targets = []
  if (isWeakAnalyte(lab)) targets.push(['half', lab.vEq / 2])
  targets.push(['eq', lab.vEq])
  for (const [key, v] of targets) {
    if (lab.markers[key] || !(before < v && v <= after + 1e-9)) continue
    const { beaker, analysis } = flaskAt(lab, v)
    const t = timeAt(v, before, after, t0, t1)
    lab.markers[key] = { t, v, pH: analysis.pH }
    lab.rows.push({
      run: lab.run, t, added: v, volume: beaker.volume, pH: analysis.pH, h: analysis.h, predicted: null,
      action: key === 'eq' ? 'Equivalence point' : 'Half-way to equivalence (pH = pKa)',
      marker: key,
    })
  }
}

// A data-table row every `rowEvery` cm³ while the tap is open
function buretteRows(lab, before, t0, t1) {
  const every = lab.config.titration.rowEvery
  while (lab.nextMark <= lab.delivered + 1e-9) {
    const v = lab.nextMark
    const { beaker, analysis } = flaskAt(lab, v)
    lab.rows.push({
      run: lab.run, t: timeAt(v, before, lab.delivered, t0, t1), added: v, volume: beaker.volume,
      pH: analysis.pH, h: analysis.h, predicted: null, action: `Burette reading ${v.toFixed(2)} cm³`,
    })
    lab.nextMark += every
  }
}

// New flask or burette contents start a new titration. The burette always
// holds the opposite kind (acid ↔ base) to the flask.
function setSetup(lab, change) {
  const setup = {
    analyte: { ...lab.setup.analyte, ...change.analyte },
    titrant: { ...lab.setup.titrant, ...change.titrant },
  }
  const analyteType = substance(lab, setup.analyte.substance).type
  if (substance(lab, setup.titrant.substance).type === analyteType) {
    setup.titrant.substance = lab.config.substances.find(s => s.type !== analyteType && s.strong).id
  }
  lab.setup = setup
  if (lab.mode === 'titration') startRun(lab)
}

// ---------- Temperature, kept runs ----------

function setTemperature(lab, tempC) {
  lab.tempC = tempC
  lab.running = true
  refresh(lab)
  sample(lab)
  lab.lastAction = 'temperature'
}

function runLabel(lab) {
  if (lab.mode === 'titration') {
    const { analyte, titrant } = lab.setup
    return `${substance(lab, analyte.substance).formula} + ${substance(lab, titrant.substance).formula}`
  }
  return lab.used.length > 0 ? lab.used.join(', ') : 'water'
}

function keepRun(lab) {
  if (lab.flow) stopFlow(lab)
  if (lab.points.length < 2) return notice(lab, 'Add something first, then keep the run.')
  addPoint(lab)
  lab.ghosts.push({
    run: lab.run,
    label: `Run ${lab.run}: ${runLabel(lab)}`,
    color: RUN_COLORS[(lab.run - 1) % RUN_COLORS.length],
    points: lab.points.slice(),
  })
  if (lab.ghosts.length > MAX_KEPT_RUNS) lab.ghosts.shift()
  lab.run += 1
  startRun(lab)
}

export { runLabel }
