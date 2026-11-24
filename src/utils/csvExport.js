// Any table as a CSV download; cells are written as given (format first)
export function exportTableCSV(headers, rows, filename) {
  const lines = [headers, ...rows].map(row => row.map(cell => escapeCsvField(cell ?? '')).join(','))
  downloadCSV(lines.join('\n'), filename)
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
