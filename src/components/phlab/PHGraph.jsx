import React from 'react'
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid, ReferenceArea, ReferenceLine, ReferenceDot, ResponsiveContainer,
} from 'recharts'
import { Chip } from './ui'

const CURRENT_COLOR = '#f4f5f8'
const PREDICTION_COLOR = '#f0c040'

// The pH lab's main graph: pH against time (default) or against the volume
// of liquid added. The current run is drawn on top of up to four kept runs.
// Shaded: acidic / basic halves, and the chosen indicator's colour change.
export function PHGraph({
  points, ghosts, xMode, onXModeChange, neutralPH, indicator, markers, predictions,
  currentLabel, onKeepRun, onClearRuns,
}) {
  const xKey = xMode === 'time' ? 't' : 'v'
  const toXY = (pts) => pts.map(p => ({ x: p[xKey], y: p.pH }))
  const current = toXY(points)
  const kept = ghosts.map(g => ({ ...g, data: toXY(g.points) }))

  const all = current.concat(...kept.map(g => g.data))
  const ys = all.map(p => p.y).concat(predictions.map(p => p.predicted))
  const xMax = niceMax(Math.max(0, ...all.map(p => p.x)), xMode)
  const xTicks = tidyTicks(xMax, xMode)
  const yMin = Math.min(0, Math.floor(Math.min(...ys)))
  const yMax = Math.max(14, Math.ceil(Math.max(...ys)))
  const yTicks = Array.from({ length: yMax - yMin + 1 }, (_, i) => yMin + i)
  const bandColor = indicator?.baseColor ?? '#8a95a8'

  return (
    <div className="rounded-lg p-3" style={{ background: '#2a2f3a' }}>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
        <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#6b7585' }}>
          pH vs {xMode === 'time' ? 'time' : 'volume added'}
        </h3>
        <div className="flex items-center gap-1.5">
          <span className="text-xs mr-1" style={{ color: '#6b7585' }}>x-axis:</span>
          <Chip active={xMode === 'time'} onClick={() => onXModeChange('time')}>Time</Chip>
          <Chip active={xMode === 'volume'} onClick={() => onXModeChange('volume')}>Volume added</Chip>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap mb-2">
        <LegendItem color={CURRENT_COLOR} label={`${currentLabel} (now)`} />
        {ghosts.map(g => <LegendItem key={g.run} color={g.color} label={g.label} faded />)}
        <div className="ml-auto flex gap-2">
          <SmallButton onClick={onKeepRun} title="Keep this curve on the graph and start a new run">
            Keep run &amp; start new
          </SmallButton>
          {ghosts.length > 0 && <SmallButton onClick={onClearRuns}>Clear kept runs</SmallButton>}
        </div>
      </div>

      {(indicator?.low != null || markers.half || markers.eq || predictions.length > 0) && (
        <div className="flex items-center gap-2 flex-wrap mb-2">
          {indicator?.low != null && (
            <LegendItem color={bandColor} label={`${indicator.name} changes colour: pH ${indicator.low}–${indicator.high}`} band />
          )}
          {markers.half && (
            <LegendItem color={PREDICTION_COLOR} dot
              label={`½ eq.: ${markers.half.v.toFixed(2)} cm³, pH = pKa = ${markers.half.pH.toFixed(2)}`} />
          )}
          {markers.eq && (
            <LegendItem color={PREDICTION_COLOR} dot
              label={`eq.: ${markers.eq.v.toFixed(2)} cm³, pH ${markers.eq.pH.toFixed(2)}`} />
          )}
          {predictions.length > 0 && <LegendItem color={PREDICTION_COLOR} label="your predictions" hollow />}
        </div>
      )}

      <div style={{ height: 380 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart margin={{ top: 12, right: 24, left: 0, bottom: 22 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#363c4a" />
            <XAxis
              type="number"
              dataKey="x"
              domain={[0, xMax]}
              ticks={xTicks}
              allowDataOverflow
              stroke="#6b7585"
              fontSize={11}
              tickFormatter={(v) => (Number.isInteger(v) ? v : v.toFixed(1))}
              label={{
                value: xMode === 'time' ? 'Time (s)' : 'Volume added (cm³)',
                position: 'insideBottom', offset: -14, fill: '#8a95a8', fontSize: 12,
              }}
            />
            <YAxis
              type="number"
              dataKey="y"
              domain={[yMin, yMax]}
              ticks={yTicks}
              allowDataOverflow
              stroke="#6b7585"
              fontSize={11}
              width={44}
              label={{ value: 'pH', angle: -90, position: 'insideLeft', offset: 12, fill: '#8a95a8', fontSize: 12 }}
            />

            <ReferenceArea y1={yMin} y2={neutralPH} fill="#e05555" fillOpacity={0.06}
              label={{ value: 'acidic', position: 'insideBottomLeft', fill: '#a35a5a', fontSize: 11 }} />
            <ReferenceArea y1={neutralPH} y2={yMax} fill="#4f9cf0" fillOpacity={0.06}
              label={{ value: 'basic', position: 'insideTopLeft', fill: '#5a7fa8', fontSize: 11 }} />
            {indicator?.low != null && (
              <ReferenceArea y1={indicator.low} y2={indicator.high} fill={bandColor} fillOpacity={0.22} />
            )}
            <ReferenceLine
              y={neutralPH}
              stroke="#8a95a8"
              strokeDasharray="5 4"
              label={{ value: `neutral (pH ${neutralPH.toFixed(2)})`, position: 'insideBottomLeft', fill: '#8a95a8', fontSize: 11 }}
            />

            {kept.map(g => (
              <Line key={g.run} data={g.data} dataKey="y" type="linear" stroke={g.color} strokeOpacity={0.6}
                strokeWidth={2} dot={false} isAnimationActive={false} />
            ))}
            <Line data={current} dataKey="y" type="linear" stroke={CURRENT_COLOR} strokeWidth={2.5}
              dot={false} isAnimationActive={false} />

            {predictions.map((p, i) => (
              <ReferenceLine key={`gap${i}`} segment={[{ x: p[xKey], y: p.predicted }, { x: p[xKey], y: p.actual }]}
                stroke={PREDICTION_COLOR} strokeDasharray="3 3" />
            ))}
            {predictions.map((p, i) => (
              <ReferenceDot key={`guess${i}`} x={p[xKey]} y={p.predicted} r={5}
                fill="#2a2f3a" stroke={PREDICTION_COLOR} strokeWidth={2} />
            ))}

            {markers.half && (
              <ReferenceDot x={markers.half[xKey]} y={markers.half.pH} r={6} fill="#f0c040" stroke="#1a1d24"
                label={{ value: '½ eq.', position: 'bottom', fill: '#f0c040', fontSize: 11 }} />
            )}
            {markers.eq && (
              <ReferenceDot x={markers.eq[xKey]} y={markers.eq.pH} r={6} fill="#f0c040" stroke="#1a1d24"
                label={{ value: 'eq.', position: 'left', fill: '#f0c040', fontSize: 11 }} />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// Round the x-axis end up to a tidy number, at least 30 s or 10 cm³. The
// small allowance stops sums like 40 × 0.05 cm³ (= 2.0000000000000004)
// from jumping a whole step.
function niceMax(x, xMode) {
  const roundUp = (step) => Math.ceil(x / step - 1e-9) * step
  if (xMode === 'time') {
    if (x <= 30) return 30
    return roundUp(x <= 120 ? 10 : x <= 600 ? 30 : 60)
  }
  if (x <= 10) return 10
  return roundUp(x <= 50 ? 5 : x <= 200 ? 10 : 25)
}

// At most ~8 ticks, on round numbers
function tidyTicks(xMax, xMode) {
  const steps = xMode === 'time' ? [5, 10, 20, 30, 60, 120, 300] : [1, 2, 5, 10, 25, 50]
  const step = steps.find(s => xMax / s <= 8) ?? steps[steps.length - 1]
  return Array.from({ length: Math.floor(xMax / step) + 1 }, (_, i) => i * step)
}

function LegendItem({ color, label, faded, hollow, dot, band }) {
  const swatch = hollow ? { width: 10, height: 10, borderRadius: 999, border: `2px solid ${color}` }
    : dot ? { width: 10, height: 10, borderRadius: 999, background: color }
    : band ? { width: 14, height: 10, borderRadius: 2, background: color, opacity: 0.45 }
    : { width: 12, height: 4, borderRadius: 2, background: color, opacity: faded ? 0.6 : 1 }
  return (
    <span className="flex items-center gap-1.5 px-2 py-1 rounded text-xs" style={{ background: '#1e2535', color: '#c8cdd8' }}>
      <span className="inline-block shrink-0" style={swatch} />
      {label}
    </span>
  )
}

function SmallButton({ children, ...props }) {
  return (
    <button
      {...props}
      className="px-2.5 py-1 rounded text-xs font-medium cursor-pointer border-0"
      style={{ background: '#1e2535', color: '#c8cdd8', border: '1px solid #363c4a', minHeight: 28 }}
    >
      {children}
    </button>
  )
}
