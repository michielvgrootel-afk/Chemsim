import React, { useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { STORAGE_KEYS } from '../utils/constants'

export function AssignmentNotes({ module }) {
  const [notes, setNotes] = useLocalStorage(STORAGE_KEYS.ASSIGNMENT_NOTES, {})
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')

  if (!module) return null

  const startEditing = (reactionId) => {
    setEditingId(reactionId)
    setEditText(notes[reactionId] || '')
  }

  const saveNote = (reactionId) => {
    setNotes(prev => ({ ...prev, [reactionId]: editText }))
    setEditingId(null)
  }

  const clearNote = (reactionId) => {
    setNotes(prev => {
      const next = { ...prev }
      delete next[reactionId]
      return next
    })
    setEditingId(null)
  }

  return (
    <div>
      <h3 className="text-base font-semibold mb-1" style={{ color: '#e8eaf0' }}>Assignment Notes</h3>
      <p className="text-sm mb-4" style={{ color: '#6b7585' }}>
        Add instructions or context that students will see alongside the simulation.
      </p>

      <div className="space-y-3">
        {module.reactions.map(rxn => (
          <div key={rxn.id} className="p-4 rounded-lg" style={{ background: '#2a2f3a', border: '1px solid #363c4a' }}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-medium" style={{ color: '#e8eaf0' }}>{rxn.name}</p>
                <p className="text-xs" style={{ color: '#6b7585' }}>{rxn.subtitle}</p>
              </div>
              {editingId !== rxn.id && (
                <button
                  onClick={() => startEditing(rxn.id)}
                  className="px-3 py-1.5 rounded text-xs font-medium cursor-pointer border-0"
                  style={{ background: '#4f9cf020', color: '#4f9cf0', minHeight: 32 }}
                >
                  {notes[rxn.id] ? 'Edit' : 'Add Note'}
                </button>
              )}
            </div>

            {editingId === rxn.id ? (
              <div className="space-y-2">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  placeholder="e.g. Explore what happens when you double the concentration..."
                  className="w-full p-3 rounded-lg text-sm outline-none resize-y"
                  style={{ background: '#1a1d24', color: '#e8eaf0', border: '1px solid #363c4a', minHeight: 80 }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => saveNote(rxn.id)}
                    className="px-3 py-1.5 rounded text-xs font-medium cursor-pointer border-0"
                    style={{ background: '#3dba7e', color: '#fff', minHeight: 32 }}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-3 py-1.5 rounded text-xs font-medium cursor-pointer border-0"
                    style={{ background: '#363c4a', color: '#8a95a8', minHeight: 32 }}
                  >
                    Cancel
                  </button>
                  {notes[rxn.id] && (
                    <button
                      onClick={() => clearNote(rxn.id)}
                      className="px-3 py-1.5 rounded text-xs font-medium cursor-pointer border-0"
                      style={{ background: '#e0555520', color: '#e05555', minHeight: 32 }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ) : notes[rxn.id] ? (
              <p className="text-sm p-3 rounded" style={{ background: '#1a1d2480', color: '#8a95a8', border: '1px solid #363c4a' }}>
                {notes[rxn.id]}
              </p>
            ) : (
              <p className="text-xs italic" style={{ color: '#6b758560' }}>No note set</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
