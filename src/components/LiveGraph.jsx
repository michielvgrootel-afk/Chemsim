import React, { useState } from 'react'
import { LineChart, Line, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const TOOLTIP_STYLE = {
  background: '#22262f',
  border: '1px solid #363c4a',
  borderRadius: 6,
  color: '#e8eaf0',
  fontSize: 12,
}

const formatTick = (v) => (Number.isInteger(v) ? v : Number(v).toFixed(1))

export function LiveGraph({ data, config, onClear }) {
  const [hiddenLines, setHiddenLines] = useState(new Set())
  const [plotId, setPlotId] = useState(null)

  if (!config) return null

  if (config.type === 'xy') {
    const plot = config.plots.find(p => p.id === plotId) || config.plots[0]
    return <XYGraph data={data} config={config} plot={plot} onSelectPlot={setPlotId} onClear={onClear} />
  }

  const toggleLine = (key) => {
    setHiddenLines(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // Y axis defaults to 0–100 % (particle-count graphs); scenarios such as
  // the pH ones override the domain and unit.
  const yDomain = config.yDomain || [0, 100]
  const yUnit = config.yUnit ?? '%'
  const yDecimals = config.yDecimals ?? 0

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#6b7585' }}>
          Live Graph
        </h3>
        <div className="flex gap-2">
          {config.lines.map(line => (
            <button
              key={line.key}
              onClick={() => toggleLine(line.key)}
              className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium cursor-pointer border-0 transition-opacity"
              style={{
                background: '#2a2f3a',
                opacity: hiddenLines.has(line.key) ? 0.4 : 1,
                color: line.color,
                textDecoration: hiddenLines.has(line.key) ? 'line-through' : 'none',
                minHeight: 28,
              }}
            >
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: line.color }} />
              {line.label}
            </button>
          ))}
        </div>
      </div>

      <AxisCaption yLabel={config.yLabel} xLabel={config.xLabel} />

      <div className="rounded-lg p-3" style={{ background: '#2a2f3a', height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#363c4a" />
            <XAxis
              dataKey="time"
              stroke="#6b7585"
              fontSize={11}
              tickFormatter={(v) => `${v}s`}
            />
            <YAxis
              stroke="#6b7585"
              fontSize={11}
              domain={yDomain}
              tickFormatter={(v) => `${v}${yUnit}`}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              labelFormatter={(v) => `Time: ${v}s`}
              formatter={(v) => [`${Number(v).toFixed(yDecimals)}${yUnit}`]}
            />
            {config.lines.map(line => (
              !hiddenLines.has(line.key) && (
                <Line
                  key={line.key}
                  type="monotone"
                  dataKey={line.key}
                  stroke={line.color}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              )
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// Scatter plot of one measured quantity against another (e.g. P vs V for
// Boyle's law). Every graph tick adds a point, so sweeping a slider traces
// out the relationship.
function XYGraph({ data, config, plot, onSelectPlot, onClear }) {
  const points = data
    .filter(d => d[plot.x] != null && d[plot.y] != null)
    .map(d => ({ x: d[plot.x], y: d[plot.y] }))

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#6b7585' }}>
          Live Graph
        </h3>
        {onClear && (
          <button
            onClick={onClear}
            className="px-2.5 py-1 rounded text-xs font-medium cursor-pointer border-0"
            style={{ background: '#2a2f3a', color: '#8a95a8', minHeight: 28 }}
          >
            Clear
          </button>
        )}
      </div>

      <div className="flex gap-1.5 flex-wrap mb-2">
        {config.plots.map(p => {
          const active = p.id === plot.id
          return (
            <button
              key={p.id}
              onClick={() => onSelectPlot(p.id)}
              className="px-2 py-1 rounded text-xs font-medium cursor-pointer border-0"
              style={{
                background: active ? p.color : '#2a2f3a',
                color: active ? '#fff' : '#8a95a8',
                minHeight: 28,
              }}
            >
              {p.label}
            </button>
          )
        })}
      </div>

      <AxisCaption yLabel={plot.yLabel} xLabel={plot.xLabel} />

      <div className="rounded-lg p-3" style={{ background: '#2a2f3a', height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#363c4a" />
            <XAxis
              type="number"
              dataKey="x"
              name={plot.xLabel}
              domain={plot.xDomain || ['auto', 'auto']}
              allowDataOverflow
              stroke="#6b7585"
              fontSize={11}
              tickFormatter={formatTick}
            />
            <YAxis
              type="number"
              dataKey="y"
              name={plot.yLabel}
              domain={plot.yDomain || [0, 'auto']}
              allowDataOverflow
              stroke="#6b7585"
              fontSize={11}
              tickFormatter={formatTick}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              cursor={{ strokeDasharray: '3 3' }}
              formatter={(v, name) => [Number(v).toFixed(1), name]}
            />
            <Scatter data={points} fill={plot.color} isAnimationActive={false} shape={renderDot} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function renderDot({ cx, cy, fill }) {
  return <circle cx={cx} cy={cy} r={2.5} fill={fill} fillOpacity={0.8} />
}

function AxisCaption({ yLabel, xLabel }) {
  if (!yLabel || !xLabel) return null
  return (
    <p className="text-xs mb-2" style={{ color: '#6b7585' }}>
      {yLabel} vs {xLabel}
    </p>
  )
}
