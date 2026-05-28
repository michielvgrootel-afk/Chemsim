import React from 'react'

// Map pH to a colour band for the meter (visual familiarity with universal indicator)
function phColor(ph) {
  if (ph < 3) return '#e05555'   // strong acid — red
  if (ph < 6) return '#f0913a'   // weak acid — orange
  if (ph < 8) return '#3dba7e'   // neutral — green
  if (ph < 11) return '#9b6ef0'  // weak base — purple
  return '#4f9cf0'                // strong base — blue
}

export function StatusBar({ stats, enzymeStats, dissolutionStats, phStats, onTakeQuiz }) {
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex items-center justify-between px-4 py-2.5 rounded-lg"
      style={{ background: '#1e2535', border: '1px solid #363c4a' }}>

      <div className="flex items-center gap-6">
        {phStats ? (
          <>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider" style={{ color: '#6b7585' }}>pH:</span>
              <span className="text-sm font-mono font-semibold" style={{ color: phColor(phStats.ph) }}>
                {phStats.ph.toFixed(1)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider" style={{ color: '#6b7585' }}>H⁺:</span>
              <span className="text-sm font-mono font-semibold" style={{ color: '#f0913a' }}>
                {phStats.hCount}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider" style={{ color: '#6b7585' }}>OH⁻:</span>
              <span className="text-sm font-mono font-semibold" style={{ color: '#56c0e0' }}>
                {phStats.ohCount}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider" style={{ color: '#6b7585' }}>Time:</span>
              <span className="text-sm font-mono font-semibold" style={{ color: '#e8eaf0' }}>
                {formatTime(stats.elapsed)}
              </span>
            </div>
          </>
        ) : dissolutionStats ? (
          <>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider" style={{ color: '#6b7585' }}>
                {dissolutionStats.separationPercent != null ? '% Separated' : '% Dissolved'}:
              </span>
              {(() => {
                const pct = dissolutionStats.separationPercent ?? dissolutionStats.dissolutionPercent ?? 0
                return (
                  <span className="text-sm font-mono font-semibold" style={{
                    color: pct > 80 ? '#3dba7e' : pct > 40 ? '#f0c040' : '#4f9cf0'
                  }}>
                    {Math.round(pct)}%
                  </span>
                )
              })()}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider" style={{ color: '#6b7585' }}>Time:</span>
              <span className="text-sm font-mono font-semibold" style={{ color: '#e8eaf0' }}>
                {formatTime(stats.elapsed)}
              </span>
            </div>
          </>
        ) : (
          <>
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
            {enzymeStats && (
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider" style={{ color: '#6b7585' }}>Enzymes:</span>
                <span className="text-sm font-mono font-semibold" style={{
                  color: enzymeStats.active === 0 ? '#e05555' : enzymeStats.active < enzymeStats.total ? '#f0913a' : '#9b6ef0'
                }}>
                  {enzymeStats.active}/{enzymeStats.total}
                </span>
              </div>
            )}
          </>
        )}
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
