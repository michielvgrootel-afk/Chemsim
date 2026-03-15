import React, { useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { STORAGE_KEYS } from '../utils/constants'
import { exportQuizResultsCSV } from '../utils/csvExport'

export function QuizResults() {
  const [results] = useLocalStorage(STORAGE_KEYS.QUIZ_RESULTS, [])
  const [filterReaction, setFilterReaction] = useState('all')

  const filteredResults = filterReaction === 'all'
    ? results
    : results.filter(r => r.reaction === filterReaction)

  const reactions = [...new Set(results.map(r => r.reaction))]

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold" style={{ color: '#e8eaf0' }}>Quiz Results</h3>
          <p className="text-sm" style={{ color: '#6b7585' }}>
            {results.length} submission{results.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={filterReaction}
            onChange={(e) => setFilterReaction(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm outline-none cursor-pointer"
            style={{ background: '#2a2f3a', color: '#e8eaf0', border: '1px solid #363c4a', minHeight: 40 }}
          >
            <option value="all">All Reactions</option>
            {reactions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <button
            onClick={() => exportQuizResultsCSV(filteredResults)}
            disabled={filteredResults.length === 0}
            className="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer border-0 disabled:opacity-40"
            style={{ background: '#3dba7e', color: '#fff', minHeight: 40 }}
          >
            Export CSV
          </button>
        </div>
      </div>

      {filteredResults.length === 0 ? (
        <div className="text-center py-12 rounded-lg" style={{ background: '#2a2f3a' }}>
          <p className="text-sm" style={{ color: '#6b7585' }}>No quiz results yet.</p>
          <p className="text-xs mt-1" style={{ color: '#6b7585' }}>
            Results will appear here after students complete quizzes.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid #363c4a' }}>
          <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#2a2f3a' }}>
                <th className="text-left px-4 py-3 font-medium" style={{ color: '#6b7585', borderBottom: '1px solid #363c4a' }}>Student</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: '#6b7585', borderBottom: '1px solid #363c4a' }}>Reaction</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: '#6b7585', borderBottom: '1px solid #363c4a' }}>Score</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: '#6b7585', borderBottom: '1px solid #363c4a' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredResults.slice().reverse().map((r, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #363c4a' }}>
                  <td className="px-4 py-3" style={{ color: '#e8eaf0' }}>{r.studentName}</td>
                  <td className="px-4 py-3" style={{ color: '#8a95a8' }}>{r.reaction}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-xs font-semibold" style={{
                      background: r.score >= r.totalQuestions * 0.8 ? '#3dba7e20' : r.score >= r.totalQuestions * 0.5 ? '#f0c04020' : '#e0555520',
                      color: r.score >= r.totalQuestions * 0.8 ? '#3dba7e' : r.score >= r.totalQuestions * 0.5 ? '#f0c040' : '#e05555',
                    }}>
                      {r.score}/{r.totalQuestions}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ color: '#6b7585' }}>
                    {new Date(r.timestamp).toLocaleDateString()} {new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
