import React, { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export function LiveGraph({ data, config }) {
  const [hiddenLines, setHiddenLines] = useState(new Set())

  const toggleLine = (key) => {
    setHiddenLines(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  if (!config) return null

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
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
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              contentStyle={{
                background: '#22262f',
                border: '1px solid #363c4a',
                borderRadius: 6,
                color: '#e8eaf0',
                fontSize: 12,
              }}
              labelFormatter={(v) => `Time: ${v}s`}
              formatter={(v) => [`${Math.round(v)}%`]}
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
