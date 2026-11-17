import React from 'react'
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid, ReferenceArea, ReferenceLine, ResponsiveContainer,
} from 'recharts'
import { stateAt } from '../../engine/imfModel'

export const STATE_COLORS = { gas: '#4f9cf0', liquid: '#f0913a', solid: '#c8cdd8' }
const PREDICTION_COLOR = '#f0c040'

// Boiling points of the current set of molecules, with the chosen
// temperature as a line: everything that boils below the line is a gas.
// Points are coloured by state at that temperature; click one to view it.
export function BPGraph({ set, selectedId, tempC, isRevealed, predictions, onSelect }) {
  const data = set.molecules.map(m => ({
    id: m.id,
    name: m.axis,
    bp: isRevealed(m.id) ? m.bp : null,
    predicted: predictions[m.id] ?? null,
    state: isRevealed(m.id) ? stateAt(m, tempC) : null,
    selected: m.id === selectedId,
  }))
  const values = data.flatMap(d => [d.bp, d.predicted]).filter(v => v != null).concat(tempC)
  const yMin = Math.floor((Math.min(...values) - 15) / 50) * 50
  const yMax = Math.ceil((Math.max(...values) + 15) / 50) * 50
  const yStep = yMax - yMin > 250 ? 50 : 25
  const yTicks = Array.from({ length: Math.round((yMax - yMin) / yStep) + 1 }, (_, i) => yMin + i * yStep)

  return (
    <div className="rounded-lg p-3" style={{ background: '#2a2f3a' }}>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
        <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#6b7585' }}>{set.title}</h3>
        <div className="flex items-center gap-2 flex-wrap text-xs" style={{ color: '#c8cdd8' }}>
          <span>At {tempC} °C:</span>
          {['gas', 'liquid', 'solid'].map(s => (
            <span key={s} className="flex items-center gap-1">
              <span className="inline-block rounded-full" style={{ width: 9, height: 9, background: STATE_COLORS[s] }} />{s}
            </span>
          ))}
          {Object.keys(predictions).length > 0 && (
            <span className="flex items-center gap-1">
              <span className="inline-block rounded-full" style={{ width: 9, height: 9, border: `2px solid ${PREDICTION_COLOR}` }} />your prediction
            </span>
          )}
        </div>
      </div>

      <div style={{ height: 250 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 10, right: 20, left: 0, bottom: 18 }}
            onClick={(e) => {
              const id = e?.activePayload?.[0]?.payload?.id
              if (id) onSelect(id)
            }}
            style={{ cursor: 'pointer' }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#363c4a" />
            <XAxis
              dataKey="name"
              stroke="#6b7585"
              fontSize={11}
              interval={0}
              label={{ value: set.axisLabel, position: 'insideBottom', offset: -10, fill: '#8a95a8', fontSize: 12 }}
            />
            <YAxis
              domain={[yMin, yMax]}
              ticks={yTicks}
              stroke="#6b7585"
              fontSize={11}
              width={48}
              allowDataOverflow
              label={{ value: 'Boiling point (°C)', angle: -90, position: 'insideLeft', offset: 10, fill: '#8a95a8', fontSize: 12, dy: 50 }}
            />
            <ReferenceArea y1={yMin} y2={tempC} fill="#4f9cf0" fillOpacity={0.07}
              label={{ value: 'boils below this temperature → gas', position: 'insideBottomRight', fill: '#5a7fa8', fontSize: 11 }} />
            <ReferenceLine y={tempC} stroke="#f0913a" strokeDasharray="5 4"
              label={{ value: `${tempC} °C`, position: 'insideTopLeft', fill: '#f0913a', fontSize: 11 }} />
            <Line
              dataKey="bp"
              type="linear"
              stroke={set.trend ? '#8a95a8' : 'transparent'}
              strokeWidth={2}
              dot={<StateDot />}
              activeDot={false}
              isAnimationActive={false}
            />
            <Line dataKey="predicted" stroke="transparent" dot={<PredictionDot />} activeDot={false} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function StateDot({ cx, cy, payload }) {
  if (cx == null || cy == null || payload?.bp == null) return null
  const r = payload.selected ? 7 : 5
  return (
    <g>
      {payload.selected && <circle cx={cx} cy={cy} r={r + 4} fill="none" stroke="#e8eaf0" strokeWidth={1.5} />}
      <circle cx={cx} cy={cy} r={r} fill={STATE_COLORS[payload.state]} stroke="#1a1d24" strokeWidth={1.5} />
    </g>
  )
}

function PredictionDot({ cx, cy, payload }) {
  if (cx == null || cy == null || payload?.predicted == null) return null
  return <circle cx={cx} cy={cy} r={5} fill="#2a2f3a" stroke={PREDICTION_COLOR} strokeWidth={2} />
}
