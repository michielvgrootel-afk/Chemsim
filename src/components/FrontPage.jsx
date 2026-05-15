import React, { useState } from 'react'

export function FrontPage({ module, allModules, activeModuleId, onModuleChange, onStart, activeModules }) {
  const [selectedReaction, setSelectedReaction] = useState(0)
  const [name, setName] = useState('')
  const [nameError, setNameError] = useState(false)

  if (!module) return null

  const filteredReactions = module.reactions.filter((_, idx) => {
    // Filter by active modules if set
    if (activeModules && activeModules.length > 0) {
      return activeModules.includes(module.reactions[idx].id)
    }
    return true
  })

  // Fallback: if the stored "active reactions" list is stale and matches
  // none of the current module's reactions (e.g. user switched modules,
  // or scenarios were renamed/removed in an update), show all reactions
  // for this module rather than rendering an empty/undefined card.
  const reactions = filteredReactions.length > 0 ? filteredReactions : module.reactions

  const currentReaction = reactions[selectedReaction] || reactions[0]

  const handleStart = () => {
    if (!name.trim()) {
      setNameError(true)
      return
    }
    setNameError(false)
    onStart(name.trim(), currentReaction)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#1a1d24' }}>
      <div className="w-full" style={{ maxWidth: 640 }}>

        {/* Module Tabs */}
        {allModules && allModules.length > 1 && (
          <div className="flex gap-2 mb-4 justify-center">
            {allModules.map(mod => (
              <button
                key={mod.id}
                onClick={() => { onModuleChange(mod.id); setSelectedReaction(0) }}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold cursor-pointer border-0 transition-all"
                style={{
                  background: mod.id === activeModuleId ? '#4f9cf0' : '#1e2535',
                  color: mod.id === activeModuleId ? '#fff' : '#6b7585',
                  border: mod.id === activeModuleId ? 'none' : '1px solid #363c4a',
                  minHeight: 44,
                }}
              >
                {mod.name}
              </button>
            ))}
          </div>
        )}

        {/* Reaction Selector Pills */}
        <div className="flex gap-2 mb-6 flex-wrap justify-center">
          {reactions.map((rxn, idx) => (
            <button
              key={rxn.id}
              onClick={() => setSelectedReaction(idx)}
              className="px-4 py-2 rounded-full text-sm font-medium cursor-pointer border-0 transition-all"
              style={{
                background: idx === selectedReaction ? '#4f9cf0' : '#2a2f3a',
                color: idx === selectedReaction ? '#fff' : '#8a95a8',
                border: idx === selectedReaction ? 'none' : '1px solid #363c4a',
                minHeight: 44,
              }}
            >
              {rxn.subtitle || rxn.name}
            </button>
          ))}
        </div>

        {/* Main Card */}
        <div className="rounded-xl overflow-hidden" style={{ background: '#22262f', border: '1px solid #363c4a' }}>

          {/* Card Header */}
          <div className="p-6" style={{ background: '#1e2535' }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ background: '#4f9cf020', color: '#4f9cf0' }}>
                {module.name}
              </span>
              <span className="text-xs" style={{ color: '#6b7585' }}>{module.level}</span>
            </div>
            <h1 className="text-2xl font-bold" style={{ color: '#e8eaf0' }}>
              {currentReaction.name}
              {currentReaction.subtitle && (
                <span className="ml-2 text-lg font-normal" style={{ color: '#8a95a8' }}>
                  {currentReaction.subtitle}
                </span>
              )}
            </h1>
          </div>

          {/* Card Body */}
          <div className="p-6 space-y-5">

            {/* Guiding Question */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: '#6b7585' }}>
                Guiding Question
              </label>
              <p className="text-base leading-relaxed" style={{ color: '#e8eaf0' }}>
                {currentReaction.guidingQuestion}
              </p>
            </div>

            {/* Assignment Goal */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: '#6b7585' }}>
                Assignment Goal
              </label>
              <p className="text-sm leading-relaxed" style={{ color: '#8a95a8' }}>
                {currentReaction.assignmentGoal}
              </p>
            </div>

            {/* Divider */}
            <div className="w-full h-px" style={{ background: '#363c4a' }} />

            {/* Name Input + Start */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: '#6b7585' }}>
                Your Name
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setNameError(false) }}
                  onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                  placeholder="Enter your name..."
                  className="flex-1 px-4 py-3 rounded-lg text-base outline-none"
                  style={{
                    background: '#2a2f3a',
                    color: '#e8eaf0',
                    border: nameError ? '1px solid #e05555' : '1px solid #363c4a',
                    minHeight: 44,
                  }}
                />
                <button
                  onClick={handleStart}
                  className="px-6 py-3 rounded-lg font-semibold cursor-pointer border-0 transition-colors flex items-center gap-2"
                  style={{
                    background: '#4f9cf0',
                    color: '#fff',
                    minHeight: 44,
                  }}
                >
                  Start
                  <span className="text-lg">&rarr;</span>
                </button>
              </div>
              {nameError && (
                <p className="text-sm mt-2" style={{ color: '#e05555' }}>
                  Please enter your name to continue.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs mt-4" style={{ color: '#6b7585' }}>
          No account required &middot; Runs entirely in your browser
        </p>
      </div>
    </div>
  )
}
