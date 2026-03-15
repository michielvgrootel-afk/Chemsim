import React from 'react'

export function StatusBar({ stats, onTakeQuiz }) {
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex items-center justify-between px-4 py-2.5 rounded-lg"
      style={{ background: '#1e2535', border: '1px solid #363c4a' }}>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wider" style={{ color: '#6b7585' }}>Rate:</span>
          <span className="text-sm font-mono font-semibold" style={{ color: '#4f9cf0' }}>
            {stats.reactionRate} rxn/s
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wider" style={{ color: '#6b7585' }}>Time:</span>
          <span className="text-sm font-mono font-semibold" style={{ color: '#e8eaf0' }}>
            {formatTime(stats.elapsed)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wider" style={{ color: '#6b7585' }}>Reactions:</span>
          <span className="text-sm font-mono font-semibold" style={{ color: '#3dba7e' }}>
            {stats.reactionCount}
          </span>
        </div>
      </div>

      <button
        onClick={onTakeQuiz}
        className="px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer border-0 transition-colors flex items-center gap-2"
        style={{
          background: '#4f9cf0',
          color: '#fff',
          minHeight: 40,
        }}
      >
        Take Quiz
        <span>&rarr;</span>
      </button>
    </div>
  )
}
