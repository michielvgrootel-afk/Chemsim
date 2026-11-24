import React, { useEffect, useRef, useState } from 'react'
import {
  createSample, setSampleTemperature, stepSample, fractionAbove, mostProbableEnergy, meanEnergy,
} from '../../engine/maxwellBoltzmann'
import { BOX, GRAPH, SPEED, FLASH_TIME, GROUPS, drawBox, drawGraph, hitBox, hitGraph, groupOf } from './drawMB'
import { Card, Chip, ActionButton, Switch, Hint } from '../LabUI'
import { StatusBar } from '../StatusBar'
import { QuizModal } from '../QuizModal'
import { ConfirmModal } from '../ConfirmModal'

const pct = (f) => `${(100 * f).toFixed(f < 0.1 ? 1 : 0)} %`

// The Maxwell–Boltzmann lab: a box of gas particles, and the same particles
// sorted by kinetic energy into the Maxwell–Boltzmann graph, one dot each.
// Scenario config: src/modules/rates-of-reaction/reactions/maxwell-boltzmann.js
export function MBLabPage({ reaction, module, pendingSwitch, onConfirmSwitch, onCancelSwitch }) {
  const cfg = reaction
  const [T, setT] = useState(cfg.temperature.default)
  const [Ea, setEa] = useState(cfg.activationEnergy.default)
  const [catalyst, setCatalyst] = useState(false)
  const [paused, setPaused] = useState(true)
  const [slow, setSlow] = useState(false)   // half speed: slow motion, the chemistry is unchanged
  const [show, setShow] = useState({ curve: true, area: true, markers: false })
  const [reference, setReference] = useState(null)
  const [selected, setSelected] = useState(null)
  const [stats, setStats] = useState(null)
  const [showQuiz, setShowQuiz] = useState(false)

  const EaCat = catalyst ? Math.round(Ea * cfg.catalystFactor * 10) / 10 : null
  const EaEff = EaCat ?? Ea
  const n = cfg.particles

  const boxRef = useRef(null)
  const graphRef = useRef(null)
  const sampleRef = useRef(null)
  const live = useRef({})
  live.current = { T, Ea, EaCat, paused, slow, show, reference, selected, onStats: setStats }

  // Sharp on high-DPI screens; drawing stays in logical units
  useEffect(() => {
    const dpr = window.devicePixelRatio || 1
    for (const [canvas, size] of [[boxRef.current, BOX], [graphRef.current, GRAPH]]) {
      canvas.width = size.w * dpr
      canvas.height = size.h * dpr
      canvas.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0)
    }
  }, [])

  useEffect(() => {
    sampleRef.current = createSample(cfg.particles, live.current.T, BOX.w, BOX.h, BOX.r)
    let raf
    let last = performance.now()
    let lastReport = 0
    const frame = (now) => {
      const s = sampleRef.current
      const p = live.current
      // Half speed runs the sample's own clock at half rate (slow motion), so the
      // counts per second, the trails and the distribution stay the same
      const dt = Math.min(0.05, (now - last) / 1000) * (p.slow ? 0.5 : 1)
      last = now
      setSampleTemperature(s, p.T)
      if (!p.paused) {
        s.time += dt
        const threshold = p.EaCat ?? p.Ea
        for (const hit of stepSample(s, dt, SPEED)) {
          if (Math.max(hit.e1, hit.e2) < threshold) continue
          s.flashes.push({ x: hit.x, y: hit.y, age: 0 })
          s.successes.push(s.time)
        }
        for (const f of s.flashes) f.age += dt
        s.flashes = s.flashes.filter(f => f.age < FLASH_TIME)
        while (s.successes.length && s.successes[0] < s.time - 5) s.successes.shift()
      }
      if (boxRef.current) drawBox(boxRef.current.getContext('2d'), s, p)
      if (graphRef.current) drawGraph(graphRef.current.getContext('2d'), s, { ...p, cfg: cfg.graph })
      if (now - lastReport > 200) {
        lastReport = now
        p.onStats(summarise(s, p))
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [cfg])

  // Click a particle (in the box or on the graph) to follow it
  const pick = (ref, size, hit) => (e) => {
    const r = ref.current.getBoundingClientRect()
    const x = ((e.clientX - r.left) * size.w) / r.width
    const y = ((e.clientY - r.top) * size.h) / r.height
    setSelected(hit(x, y))
  }

  const fraction = fractionAbove(Ea, T)
  const fractionCat = EaCat != null ? fractionAbove(EaCat, T) : null
  const referenceFraction = reference != null ? fractionAbove(EaEff, reference) : null
  const annotation = pickAnnotation(cfg.annotations, { temperature: T, Ea, catalyst }, {
    n,
    reference,
    fraction: fractionAbove(EaEff, T),
    referenceFraction,
  })
  const selectedE = stats?.selectedE
  const selectedGroup = selectedE != null ? groupOf(selectedE, Ea, EaCat) : null

  return (
    <div className="flex flex-col min-h-[calc(100vh-52px)]">
      <div className="flex flex-1 gap-0">

        {/* Left: the particles, then the same particles on the graph */}
        <div className="flex-1 p-4 flex flex-col gap-3 min-w-0">
          <div className="rounded-lg p-3" style={{ background: '#2a2f3a' }}>
            <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
              <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#6b7585' }}>
                A sample of {n} gas particles at {T} K
              </h3>
              <Legend catalyst={catalyst} />
            </div>
            <canvas
              ref={boxRef}
              onClick={pick(boxRef, BOX, (x, y) => hitBox(sampleRef.current, x, y))}
              role="img"
              aria-label="Gas particles moving in a box, coloured by whether they have enough energy to react"
              style={{ width: '100%', height: 'auto', aspectRatio: `${BOX.w} / ${BOX.h}`, display: 'block', borderRadius: 8, cursor: 'pointer' }}
            />
            <div className="flex items-center gap-3 flex-wrap mt-2">
              <button
                onClick={() => setPaused(p => !p)}
                className="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer border-0"
                style={{ background: paused ? '#3dba7e' : '#1e2535', color: paused ? '#fff' : '#e8eaf0', border: '1px solid #363c4a', minHeight: 40 }}
              >
                {paused ? '▶ Play' : '⏸ Freeze'}
              </button>
              <Switch on={slow} onChange={setSlow} label="Half speed" />
              <span className="text-xs flex-1" style={{ color: '#6b7585', minWidth: 220 }}>
                Faster particles have more kinetic energy (longer trails). In every collision the two particles share their energy
                out again, so each particle's energy keeps changing. A yellow ring: a collision with enough energy to react.
              </span>
            </div>
          </div>

          <div className="rounded-lg p-3" style={{ background: '#2a2f3a' }}>
            <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
              <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#6b7585' }}>
                The same particles, sorted by energy
              </h3>
              <span className="text-xs" style={{ color: '#c8cdd8' }}>
                one dot = one particle · <span style={{ color: '#e8eaf0', fontWeight: 600 }}>curve</span> = the same graph for billions of particles
              </span>
            </div>
            <canvas
              ref={graphRef}
              onClick={pick(graphRef, GRAPH, (x, y) => hitGraph(sampleRef.current, cfg.graph, x, y))}
              role="img"
              aria-label="Maxwell–Boltzmann distribution: number of particles against kinetic energy, one dot per particle"
              style={{ width: '100%', height: 'auto', aspectRatio: `${GRAPH.w} / ${GRAPH.h}`, display: 'block', borderRadius: 8, cursor: 'pointer' }}
            />
          </div>

          {annotation && (
            <div
              className="rounded-lg text-sm leading-relaxed"
              style={{ background: 'rgba(34, 38, 47, 0.95)', border: '1px solid rgba(79, 156, 240, 0.35)', color: '#e8eaf0', padding: '10px 14px' }}
            >
              {annotation}
            </div>
          )}
        </div>

        {/* Right: controls and numbers */}
        <div className="flex flex-col gap-4 p-4 overflow-y-auto" style={{ width: 340, minWidth: 300, borderLeft: '1px solid #363c4a', maxHeight: 'calc(100vh - 52px)' }}>
          <Card title="Temperature" right={
            <span className="text-sm font-mono font-semibold" style={{ color: '#f0913a' }}>{T} K ({T - 273} °C)</span>
          }>
            <input
              type="range"
              min={cfg.temperature.min}
              max={cfg.temperature.max}
              step={cfg.temperature.step}
              value={T}
              onChange={(e) => setT(Number(e.target.value))}
              className="w-full"
              style={{ minHeight: 32 }}
              aria-label="Temperature"
            />
            <div className="flex items-center gap-2 flex-wrap">
              <ActionButton small onClick={() => setReference(T)}>Keep this curve</ActionButton>
              {reference != null && (
                <>
                  <span className="text-xs" style={{ color: '#8a95a8' }}>dashed: {reference} K</span>
                  <Chip onClick={() => setReference(null)}>Clear</Chip>
                </>
              )}
            </div>
            <Hint>Keep the curve, then change the temperature to compare.</Hint>
          </Card>

          <Card title="Activation energy" right={
            <span className="text-sm font-mono font-semibold" style={{ color: GROUPS.high.color }}>{Ea.toFixed(1)} kJ mol⁻¹</span>
          }>
            <input
              type="range"
              min={cfg.activationEnergy.min}
              max={cfg.activationEnergy.max}
              step={cfg.activationEnergy.step}
              value={Ea}
              onChange={(e) => setEa(Number(e.target.value))}
              className="w-full"
              style={{ minHeight: 32 }}
              aria-label="Activation energy"
            />
            <Switch on={catalyst} onChange={setCatalyst} label={`Catalyst (Ea → ${(Ea * cfg.catalystFactor).toFixed(1)} kJ mol⁻¹)`} />
            <Hint>
              The minimum energy colliding particles need to react. Real reactions often need 50–100 kJ mol⁻¹: then only about
              one particle in a billion has enough at room temperature, far too few to see here.
            </Hint>
          </Card>

          <Card title="Particles with enough energy">
            <Row
              label={<>E ≥ Ea <span style={{ color: '#6b7585' }}>({Ea.toFixed(1)})</span></>}
              color={GROUPS.high.color}
              sample={stats ? `${stats.above} of ${n}` : '…'}
              curve={pct(fraction)}
            />
            {catalyst && (
              <Row
                label={<>with the catalyst <span style={{ color: '#6b7585' }}>({EaCat.toFixed(1)})</span></>}
                color={GROUPS.cat.color}
                sample={stats?.aboveCat != null ? `${stats.aboveCat} of ${n}` : '…'}
                curve={pct(fractionCat)}
              />
            )}
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs pt-1">
              <Fact label="Most probable energy" value={`${mostProbableEnergy(T).toFixed(1)} kJ mol⁻¹`} />
              <Fact label="Mean energy" value={`${meanEnergy(T).toFixed(1)} kJ mol⁻¹`} />
              <Fact label="Collisions that can react" value={stats?.perSecond != null ? `${stats.perSecond.toFixed(1)} per s` : 'press Play'} />
            </div>
            <Hint>
              The count is the sample in the box right now: it changes as particles collide. The share under the curve is for a
              huge number of particles: the area to the right of Ea.
            </Hint>
          </Card>

          <Card title="Follow a particle">
            {selectedE != null ? (
              <>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm" style={{ color: '#c8cdd8' }}>Its kinetic energy</span>
                  <span className="text-lg font-mono font-bold" style={{ color: GROUPS[selectedGroup].color }}>{selectedE.toFixed(1)} kJ mol⁻¹</span>
                </div>
                <p className="text-sm" style={{ color: '#e8eaf0' }}>
                  {selectedGroup === 'high'
                    ? 'More than Ea: if it collides now, it can react.'
                    : selectedGroup === 'cat'
                      ? 'Less than Ea, but more than Ea with the catalyst: only with the catalyst can it react.'
                      : 'Less than Ea: if it collides now, it just bounces off.'}
                </p>
                <Hint>Press Play and watch its dot jump along the graph each time it collides, while the shape of the graph stays the same.</Hint>
                <div><Chip onClick={() => setSelected(null)}>Stop following</Chip></div>
              </>
            ) : (
              <Hint>Click any particle in the box, or any dot on the graph, to see where it is in the other.</Hint>
            )}
          </Card>

          <Card title="Show">
            <Switch on={show.curve} onChange={(v) => setShow(s => ({ ...s, curve: v }))} label="Maxwell–Boltzmann curve" />
            <Switch on={show.area} onChange={(v) => setShow(s => ({ ...s, area: v }))} label="Area beyond Ea" />
            <Switch on={show.markers} onChange={(v) => setShow(s => ({ ...s, markers: v }))} label="Most probable and mean energy" />
          </Card>
        </div>
      </div>

      <div className="px-4 pb-4">
        <StatusBar
          items={[
            { label: 'Temperature', value: `${T} K`, color: '#f0913a' },
            { label: 'Ea', value: `${EaEff.toFixed(1)} kJ mol⁻¹`, color: catalyst ? GROUPS.cat.color : GROUPS.high.color },
            { label: 'Enough energy', value: pct(fractionAbove(EaEff, T)), color: '#e8eaf0' },
            { label: 'Particles', value: n, color: '#4f9cf0' },
          ]}
          onTakeQuiz={() => setShowQuiz(true)}
        />
      </div>

      <QuizModal
        isOpen={showQuiz}
        quiz={module.getQuiz(reaction.id)}
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

function summarise(s, p) {
  let above = 0
  let aboveCat = 0
  for (const q of s.particles) {
    if (q.E >= p.Ea) above++
    if (p.EaCat != null && q.E >= p.EaCat) aboveCat++
  }
  return {
    above,
    aboveCat: p.EaCat != null ? aboveCat : null,
    perSecond: s.time >= 1 ? s.successes.length / Math.min(5, s.time) : null,
    selectedE: p.selected != null ? s.particles[p.selected]?.E ?? null : null,
  }
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

function Legend({ catalyst }) {
  const items = [['low', '●'], ...(catalyst ? [['cat', '▲']] : []), ['high', '◆']]
  return (
    <div className="flex items-center gap-3 flex-wrap text-xs" style={{ color: '#c8cdd8' }}>
      {items.map(([g, symbol]) => (
        <span key={g} className="flex items-center gap-1.5">
          <span style={{ color: GROUPS[g].color }}>{symbol}</span>{GROUPS[g].label}
        </span>
      ))}
    </div>
  )
}

function Row({ label, color, sample, curve }) {
  return (
    <div className="text-sm">
      <div className="flex items-baseline justify-between gap-2">
        <span className="whitespace-nowrap" style={{ color }}>{label}</span>
        <span className="font-mono font-semibold whitespace-nowrap" style={{ color: '#e8eaf0' }}>{sample}</span>
      </div>
      <div className="flex justify-between gap-2 text-xs" style={{ color: '#6b7585' }}>
        <span>share under the curve</span>
        <span className="font-mono">{curve}</span>
      </div>
    </div>
  )
}

function Fact({ label, value }) {
  return (
    <div className="flex flex-col">
      <span style={{ color: '#6b7585' }}>{label}</span>
      <span className="font-mono" style={{ color: '#e8eaf0', fontWeight: 500, fontSize: 13 }}>{value}</span>
    </div>
  )
}
