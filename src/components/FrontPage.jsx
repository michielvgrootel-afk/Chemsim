import React, { useState } from 'react'
import { YEAR_GROUPS } from '../utils/constants'
import { getEnabledReactions } from '../modules/registry'

export function FrontPage({ modules, enabledIds, yearId, onYearChange, initialReactionId, onStart }) {
  const [selectedId, setSelectedId] = useState(initialReactionId || null)

  const year = YEAR_GROUPS.find(y => y.id === yearId) || YEAR_GROUPS[0]

  // Simulations for this year group, grouped by topic (module)
  const sections = modules
    .map(mod => ({
      mod,
      reactions: getEnabledReactions(mod, enabledIds).filter(r => r.yearGroups?.includes(year.id)),
    }))
    .filter(section => section.reactions.length > 0)

  const entries = sections.flatMap(({ mod, reactions }) => reactions.map(reaction => ({ mod, reaction })))
  const current = entries.find(e => e.reaction.id === selectedId) || entries[0]

  const changeYear = (id) => {
    setSelectedId(null)
    onYearChange(id)
  }

  const isDP = year.id.startsWith('DP')

  return (
    <div className="min-h-screen flex justify-center px-6 py-10" style={{ background: '#1a1d24' }}>
      <div className="w-full" style={{ maxWidth: 720 }}>

        {/* Year group tabs */}
        <p className="text-center text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#6b7585' }}>
          Choose your year group
        </p>
        <div className="flex justify-center mb-2">
          <div className="inline-flex p-1 rounded-xl gap-1" style={{ background: '#22262f', border: '1px solid #363c4a' }}>
            {YEAR_GROUPS.map(y => (
              <button
                key={y.id}
                onClick={() => changeYear(y.id)}
                aria-pressed={y.id === year.id}
                className="px-6 py-2 rounded-lg text-sm font-semibold cursor-pointer border-0 transition-colors"
                style={{
                  background: y.id === year.id ? '#4f9cf0' : 'transparent',
                  color: y.id === year.id ? '#fff' : '#8a95a8',
                  minHeight: 44,
                }}
              >
                {y.label}
              </button>
            ))}
          </div>
        </div>
        <p className="text-center text-sm mb-8" style={{ color: '#6b7585' }}>{year.blurb}</p>

        {/* Simulations grouped by topic */}
        <div className="space-y-5 mb-6">
          {sections.map(({ mod, reactions }) => (
            <div key={mod.id}>
              <h2 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#6b7585' }}>
                {mod.name}
              </h2>
              <div className="flex gap-2 flex-wrap">
                {reactions.map(rxn => {
                  const active = current?.reaction.id === rxn.id
                  return (
                    <button
                      key={rxn.id}
                      onClick={() => setSelectedId(rxn.id)}
                      className="px-4 py-2 rounded-full text-sm font-medium cursor-pointer border-0 transition-all"
                      style={{
                        background: active ? '#4f9cf0' : '#2a2f3a',
                        color: active ? '#fff' : '#8a95a8',
                        border: active ? 'none' : '1px solid #363c4a',
                        minHeight: 44,
                      }}
                    >
                      {rxn.name}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Selected simulation */}
        {current ? (
          <div className="rounded-xl overflow-hidden" style={{ background: '#22262f', border: '1px solid #363c4a' }}>
            <div className="p-6" style={{ background: '#1e2535' }}>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ background: '#4f9cf020', color: '#4f9cf0' }}>
                  {current.mod.name}
                </span>
                <span className="text-xs" style={{ color: '#6b7585' }}>{year.label}</span>
                {isDP && current.reaction.syllabusRef && (
                  <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ background: '#9b6ef020', color: '#b89af5' }}>
                    IB {current.reaction.syllabusRef}
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold" style={{ color: '#e8eaf0' }}>
                {current.reaction.name}
                {current.reaction.subtitle && (
                  <span className="ml-2 text-lg font-normal" style={{ color: '#8a95a8' }}>
                    {current.reaction.subtitle}
                  </span>
                )}
              </h1>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: '#6b7585' }}>
                  Guiding Question
                </label>
                <p className="text-base leading-relaxed" style={{ color: '#e8eaf0' }}>
                  {current.reaction.guidingQuestion}
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: '#6b7585' }}>
                  Assignment Goal
                </label>
                <p className="text-sm leading-relaxed" style={{ color: '#8a95a8' }}>
                  {current.reaction.assignmentGoal}
                </p>
              </div>

              <button
                onClick={() => onStart(current.reaction, current.mod.id, year.id)}
                className="w-full px-6 py-3 rounded-lg font-semibold cursor-pointer border-0 transition-colors flex items-center justify-center gap-2"
                style={{ background: '#4f9cf0', color: '#fff', minHeight: 48 }}
              >
                Start simulation
                <span className="text-lg">&rarr;</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl p-8 text-center" style={{ background: '#22262f', border: '1px solid #363c4a' }}>
            <p className="text-sm" style={{ color: '#8a95a8' }}>No simulations are available for {year.label} yet.</p>
          </div>
        )}

        <p className="text-center text-xs mt-4" style={{ color: '#6b7585' }}>
          No account required &middot; Runs entirely in your browser
        </p>
      </div>
    </div>
  )
}
