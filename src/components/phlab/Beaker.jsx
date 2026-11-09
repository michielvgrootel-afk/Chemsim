import React from 'react'

const GLASS = '#9aa4b5'
const FULL_HEIGHT = 160     // drawing height (px) of a full beaker
const BURETTE_SPACE = 112   // extra drawing height above the beaker for the burette

// The beaker: liquid level from the volume, liquid colour from the indicator.
// In titration mode a 50 cm³ burette hangs above it, dripping while open.
export function Beaker({ volume, capacity, color, burette }) {
  const off = burette ? BURETTE_SPACE : 0
  const rim = 20 + off
  const bottom = 200 + off
  const level = Math.min(1, volume / capacity) * FULL_HEIGHT
  const surface = bottom - level
  const marks = [50, 100, 150, 200, 250].filter(m => m <= capacity)
  const inside = `M 52 ${rim} L 52 ${bottom - 8} Q 52 ${bottom} 60 ${bottom} L 160 ${bottom} Q 168 ${bottom} 168 ${bottom - 8} L 168 ${rim} Z`

  return (
    <svg
      viewBox={`0 0 220 ${212 + off}`}
      className="w-full"
      style={{ maxHeight: burette ? 300 : 200 }}
      role="img"
      aria-label={`Beaker holding ${volume.toFixed(1)} cm³`}
    >
      <defs>
        <clipPath id="phlab-beaker-inside"><path d={inside} /></clipPath>
        <linearGradient id="phlab-liquid-shine" x1="0" x2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.14" />
          <stop offset="0.35" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.06" />
        </linearGradient>
      </defs>

      {burette && <Burette {...burette} surface={surface} />}

      <path d={inside} fill="rgba(255,255,255,0.03)" />
      <g clipPath="url(#phlab-beaker-inside)">
        <rect x={52} y={surface} width={116} height={level + 2} fill={color} style={{ transition: 'fill 0.4s' }} />
        <rect x={52} y={surface} width={116} height={level + 2} fill="url(#phlab-liquid-shine)" />
        <rect x={52} y={surface} width={116} height={2} fill="rgba(255,255,255,0.35)" />
      </g>

      {marks.map(m => {
        const y = bottom - (m / capacity) * FULL_HEIGHT
        return (
          <g key={m}>
            <line x1={56} x2={68} y1={y} y2={y} stroke="rgba(255,255,255,0.45)" strokeWidth={1} />
            <text x={72} y={y + 3.5} fontSize={9} fill="rgba(255,255,255,0.55)">{m}</text>
          </g>
        )
      })}
      <text x={136} y={rim + 14} fontSize={9} fill="rgba(255,255,255,0.45)">cm³</text>

      <path
        d={`M 44 ${rim - 4} L 52 ${rim} L 52 ${bottom - 8} Q 52 ${bottom} 60 ${bottom} L 160 ${bottom} Q 168 ${bottom} 168 ${bottom - 8} L 168 ${rim} L 176 ${rim - 4}`}
        fill="none"
        stroke={GLASS}
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

// A 50 cm³ burette: the reading (0 at the top) is how much has run out
function Burette({ delivered, rate, color, surface }) {
  const top = 6
  const length = 92
  const reading = Math.min(delivered, 50)
  const liquidTop = top + (reading / 50) * length
  const tapY = top + length + 2
  const tipEnd = tapY + 14
  const open = rate > 0
  const dropTime = rate >= 0.5 ? '0.35s' : '0.9s'

  return (
    <g>
      {[0, 10, 20, 30, 40, 50].map(m => {
        const y = top + (m / 50) * length
        return (
          <g key={m}>
            <line x1={96} x2={103} y1={y} y2={y} stroke="rgba(255,255,255,0.4)" />
            <text x={93} y={y + 3} fontSize={8} textAnchor="end" fill="rgba(255,255,255,0.5)">{m}</text>
          </g>
        )
      })}
      <rect x={104} y={liquidTop} width={12} height={top + length - liquidTop} fill={color} />
      <rect x={104} y={top} width={12} height={length} rx={2} fill="none" stroke={GLASS} strokeWidth={2} />
      <rect x={102} y={tapY} width={16} height={7} rx={2} fill="#6b7585" />
      <rect
        x={open ? 96 : 107}
        y={open ? tapY + 2 : tapY - 6}
        width={open ? 28 : 6}
        height={open ? 3 : 19}
        rx={1.5}
        fill="#c8cdd8"
      />
      <path d={`M 108 ${tapY + 7} L 108 ${tipEnd} L 110 ${tipEnd + 4} L 112 ${tipEnd} L 112 ${tapY + 7}`} fill="none" stroke={GLASS} strokeWidth={1.5} />
      {open && [0, 1].map(i => (
        <circle key={i} cx={110} r={2.2} fill={color}>
          <animate attributeName="cy" from={tipEnd + 5} to={surface} dur={dropTime} begin={`${i * 0.17}s`} repeatCount="indefinite" />
        </circle>
      ))}
      <text x={124} y={liquidTop + 3} fontSize={9} fill="#e8eaf0">{delivered.toFixed(2)} cm³</text>
    </g>
  )
}
