import React, { useState, useEffect } from 'react'
import { SCREENS } from '../utils/constants'

// Short labels for the nav bar
const shortLabels = {
  'general': 'A+B→C',
  'aspirin': 'Aspirin',
  'fermentation': 'Fermentation',
  'haber': 'Haber',
  'maxwell-boltzmann': 'Maxwell–Boltzmann',
}

export function TopBar({ currentScreen, onNavigate, reactions, activeReactionId, onReactionSwitch }) {
  const inSimulation = currentScreen === SCREENS.SIMULATION

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

        {inSimulation && reactions && (
          <>
            <div className="w-px h-6" style={{ background: '#363c4a' }} />
            <div className="flex gap-1">
              {reactions.map(rxn => (
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
              ))}
            </div>
          </>
        )}
      </div>

      {/* Right: a link that opens this simulation (e.g. for a ManageBac assignment) */}
      {inSimulation && activeReactionId && <CopyLink reactionId={activeReactionId} />}
    </div>
  )
}

function CopyLink({ reactionId }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  const copy = async () => {
    const url = `${window.location.origin}${window.location.pathname}?reaction=${reactionId}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
    } catch {
      // No clipboard access (old browser or blocked): show the link to copy by hand
      window.prompt('Copy this link to the simulation:', url)
    }
  }

  return (
    <button
      onClick={copy}
      title="Copy a link that opens this simulation, e.g. for a ManageBac assignment"
      className="px-3 py-1.5 rounded-md text-sm font-medium cursor-pointer border-0 transition-colors whitespace-nowrap"
      style={{
        background: copied ? '#3dba7e' : 'transparent',
        color: copied ? '#fff' : '#8a95a8',
        border: `1px solid ${copied ? '#3dba7e' : '#363c4a'}`,
        minHeight: 36,
      }}
    >
      {copied ? '✓ Link copied' : '🔗 Copy link'}
    </button>
  )
}
