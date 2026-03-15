// Generate and download CSV from quiz results

export function exportQuizResultsCSV(results) {
  if (!results || results.length === 0) return

  const headers = ['Student Name', 'Module', 'Reaction', 'Score', 'Total Questions', 'Percentage', 'Timestamp']
  const rows = results.map(r => [
    escapeCsvField(r.studentName),
    escapeCsvField(r.module || 'Rates of Reaction'),
    escapeCsvField(r.reaction),
    r.score,
    r.totalQuestions,
    Math.round((r.score / r.totalQuestions) * 100) + '%',
    new Date(r.timestamp).toLocaleString(),
  ])

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  downloadCSV(csv, `chemsim-quiz-results-${new Date().toISOString().slice(0, 10)}.csv`)
}

function escapeCsvField(field) {
  const str = String(field || '')
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function downloadCSV(csv, filename) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
