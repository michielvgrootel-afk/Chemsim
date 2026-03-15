import React from 'react'
import { SCREENS } from '../utils/constants'

export function TopBar({ currentScreen, onNavigate, studentName, reactions, activeReactionId, onReactionSwitch }) {
  return (
    <div className="sticky top-0 z-50 flex items-center justify-between px-6 py-3"
      style={{ background: '#22262f', borderBottom: '1px solid #363c4a' }}>

      {/* Left: Logo */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => onNavigate(SCREENS.FRONT)}
          className="text-lg font-bold cursor-pointer bg-transparent border-0"
          style={{ fontFamily: 'Syne, sans-serif' }}
        >
          <span style={{ color: '#4f9cf0' }}>Chem</span>
          <span style={{ color: '#e8eaf0' }}>Sim</span>
        </button>

        {currentScreen === SCREENS.SIMULATION && reactions && (
          <>
            <div className="w-px h-6" style={{ background: '#363c4a' }} />
            <div className="flex gap-1">
              {reactions.map(rxn => {
                // Short labels for nav bar
                const shortLabels = {
                  'general': 'A+B\u2192C',
                  'aspirin': 'Aspirin',
                  'fermentation': 'Fermentation',
                  'haber': 'Haber',
                }
                return (
                  <button
                    key={rxn.id}
                    onClick={() => onReactionSwitch(rxn.id)}
                    className="px-3 py-1.5 rounded-md text-sm font-medium cursor-pointer border-0 transition-colors whitespace-nowrap"
                    style={{
                      background: rxn.id === activeReactionId ? '#4f9cf0' : 'transparent',
                      color: rxn.id === activeReactionId ? '#fff' : '#8a95a8',
                      minHeight: 36,
                    }}
                  >
                    {shortLabels[rxn.id] || rxn.name}
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Right: Student name + Teacher link */}
      <div className="flex items-center gap-4">
        {studentName && currentScreen === SCREENS.SIMULATION && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md" style={{ background: '#2a2f3a' }}>
            <span className="text-xs" style={{ color: '#6b7585' }}>Student:</span>
            <span className="text-sm font-medium" style={{ color: '#e8eaf0' }}>{studentName}</span>
          </div>
        )}
        <button
          onClick={() => onNavigate(SCREENS.TEACHER)}
          className="px-3 py-1.5 rounded-md text-sm cursor-pointer border-0 transition-colors"
          style={{ background: 'transparent', color: '#6b7585', minHeight: 36 }}
        >
          Teacher
        </button>
      </div>
    </div>
  )
}
