import React from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { STORAGE_KEYS } from '../utils/constants'

export function ModuleManager({ module }) {
  const [activeModules, setActiveModules] = useLocalStorage(
    STORAGE_KEYS.ACTIVE_MODULES,
    module ? module.reactions.map(r => r.id) : []
  )

  if (!module) return <p style={{ color: '#6b7585' }}>No modules available.</p>

  const toggleReaction = (reactionId) => {
    setActiveModules(prev => {
      if (prev.includes(reactionId)) {
        // Don't allow deactivating all
        if (prev.length <= 1) return prev
        return prev.filter(id => id !== reactionId)
      }
      return [...prev, reactionId]
    })
  }

  const getShareUrl = (reactionId) => {
    const base = window.location.origin + window.location.pathname
    return `${base}?reaction=${reactionId}`
  }

  const copyLink = (reactionId) => {
    navigator.clipboard?.writeText(getShareUrl(reactionId))
  }

  return (
    <div>
      <h3 className="text-base font-semibold mb-1" style={{ color: '#e8eaf0' }}>Module Management</h3>
      <p className="text-sm mb-4" style={{ color: '#6b7585' }}>
        Toggle reactions on/off. Students will only see active reactions.
      </p>

      <div className="space-y-3">
        {module.reactions.map(rxn => {
          const isActive = activeModules.includes(rxn.id)
          return (
            <div key={rxn.id} className="flex items-center justify-between p-4 rounded-lg"
              style={{ background: '#2a2f3a', border: '1px solid #363c4a' }}>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleReaction(rxn.id)}
                  className="relative w-11 h-6 rounded-full transition-colors cursor-pointer border-0"
                  style={{ background: isActive ? '#3dba7e' : '#363c4a', minWidth: 44, minHeight: 24 }}
                >
                  <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform"
                    style={{ transform: isActive ? 'translateX(22px)' : 'translateX(2px)' }} />
                </button>
                <div>
                  <p className="text-sm font-medium" style={{ color: '#e8eaf0' }}>{rxn.name}</p>
                  <p className="text-xs" style={{ color: '#6b7585' }}>{rxn.subtitle}</p>
                </div>
              </div>
              <button
                onClick={() => copyLink(rxn.id)}
                className="px-3 py-1.5 rounded text-xs font-medium cursor-pointer border-0"
                style={{ background: '#4f9cf020', color: '#4f9cf0', minHeight: 32 }}
              >
                Copy Link
              </button>
            </div>
          )
        })}
      </div>

      <div className="mt-6 p-4 rounded-lg" style={{ background: '#2a2f3a', border: '1px solid #363c4a' }}>
        <h4 className="text-sm font-semibold mb-2" style={{ color: '#e8eaf0' }}>Shareable Link</h4>
        <p className="text-xs mb-2" style={{ color: '#6b7585' }}>
          Copy this link and paste it into your Managebac assignment:
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            readOnly
            value={window.location.origin + window.location.pathname}
            className="flex-1 px-3 py-2 rounded text-xs font-mono outline-none"
            style={{ background: '#1a1d24', color: '#8a95a8', border: '1px solid #363c4a' }}
          />
          <button
            onClick={() => navigator.clipboard?.writeText(window.location.origin + window.location.pathname)}
            className="px-3 py-2 rounded text-xs font-medium cursor-pointer border-0"
            style={{ background: '#4f9cf0', color: '#fff', minHeight: 36 }}
          >
            Copy
          </button>
        </div>
      </div>
    </div>
  )
}
