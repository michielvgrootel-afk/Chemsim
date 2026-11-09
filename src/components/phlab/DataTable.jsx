import React, { useEffect, useRef, useState } from 'react'
import { exportTableCSV } from '../../utils/csvExport'
import { formatSci } from './format'

// Every step of every run, ready to copy into a lab write-up
export function DataTable({ rows }) {
  const [open, setOpen] = useState(true)
  const scrollRef = useRef(null)
  const multipleRuns = new Set(rows.map(r => r.run)).size > 1
  const hasPredictions = rows.some(r => r.predicted != null)

  // Keep the newest row in view
  useEffect(() => {
    if (open && scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [rows.length, open])

  const download = () => {
    const headers = ['Run', 'Time (s)', 'Action', 'Volume added (cm3)', 'Volume in beaker (cm3)', 'pH', '[H+] (mol dm-3)', 'Predicted pH']
    const cells = rows.map(r => [
      String(r.run),
      r.t.toFixed(1),
      r.action,
      r.added.toFixed(2),
      r.volume.toFixed(2),
      r.pH != null ? r.pH.toFixed(2) : '',
      r.h != null ? r.h.toExponential(3) : '',
      r.predicted != null ? r.predicted.toFixed(2) : '',
    ])
    exportTableCSV(headers, cells, `chemsim-ph-lab-${new Date().toISOString().slice(0, 10)}.csv`)
  }

  return (
    <div className="rounded-lg p-3" style={{ background: '#2a2f3a' }}>
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => setOpen(o => !o)}
          className="text-sm font-semibold uppercase tracking-wider cursor-pointer border-0 bg-transparent p-0"
          style={{ color: '#6b7585' }}
          aria-expanded={open}
        >
          {open ? '▾' : '▸'} Data table ({rows.length} {rows.length === 1 ? 'row' : 'rows'})
        </button>
        <button
          onClick={download}
          className="px-2.5 py-1 rounded text-xs font-medium cursor-pointer border-0"
          style={{ background: '#1e2535', color: '#c8cdd8', border: '1px solid #363c4a', minHeight: 28 }}
        >
          Download CSV
        </button>
      </div>

      {open && (
        <div ref={scrollRef} className="mt-2 overflow-auto rounded" style={{ maxHeight: 220, background: '#1e2535' }}>
          <table className="w-full text-xs" style={{ color: '#c8cdd8', borderCollapse: 'collapse' }}>
            <thead className="sticky top-0" style={{ background: '#1e2535' }}>
              <tr style={{ color: '#6b7585' }}>
                {multipleRuns && <Th>Run</Th>}
                <Th>Time (s)</Th>
                <Th left>Action</Th>
                <Th>Added (cm³)</Th>
                <Th>Volume (cm³)</Th>
                <Th>pH</Th>
                <Th>[H⁺] (mol dm⁻³)</Th>
                {hasPredictions && <Th>Predicted</Th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} style={{ borderTop: '1px solid #2a2f3a', color: r.marker ? '#f0c040' : undefined }}>
                  {multipleRuns && <Td>{r.run}</Td>}
                  <Td>{r.t.toFixed(1)}</Td>
                  <Td left>{r.action}</Td>
                  <Td>{r.added.toFixed(2)}</Td>
                  <Td>{r.volume.toFixed(1)}</Td>
                  <Td strong>{r.pH != null ? r.pH.toFixed(2) : '—'}</Td>
                  <Td>{formatSci(r.h)}</Td>
                  {hasPredictions && <Td>{r.predicted != null ? r.predicted.toFixed(1) : ''}</Td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function Th({ children, left }) {
  return <th className={`px-2 py-1.5 font-semibold whitespace-nowrap ${left ? 'text-left' : 'text-right'}`}>{children}</th>
}

function Td({ children, left, strong }) {
  return (
    <td className={`px-2 py-1 whitespace-nowrap font-mono ${left ? 'text-left' : 'text-right'}`}
      style={{ fontWeight: strong ? 600 : 400, fontFamily: left ? 'inherit' : undefined }}>
      {children}
    </td>
  )
}
