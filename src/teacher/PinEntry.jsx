import React, { useState } from 'react'
import { getItem, setItem } from '../utils/storage'
import { STORAGE_KEYS } from '../utils/constants'

export function PinEntry({ onSuccess }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [isSetup, setIsSetup] = useState(() => !getItem(STORAGE_KEYS.PIN))
  const [confirmPin, setConfirmPin] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()

    if (isSetup) {
      // Setting up new PIN
      if (pin.length < 4) {
        setError('PIN must be at least 4 digits')
        return
      }
      if (pin !== confirmPin) {
        setError('PINs do not match')
        return
      }
      setItem(STORAGE_KEYS.PIN, pin)
      onSuccess()
    } else {
      // Verifying existing PIN
      const storedPin = getItem(STORAGE_KEYS.PIN)
      if (pin === storedPin) {
        onSuccess()
      } else {
        setError('Incorrect PIN')
        setPin('')
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#1a1d24' }}>
      <div className="w-full rounded-xl p-6" style={{ background: '#22262f', border: '1px solid #363c4a', maxWidth: 400 }}>
        <div className="text-center mb-6">
          <span className="text-2xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>
            <span style={{ color: '#4f9cf0' }}>Chem</span>
            <span style={{ color: '#e8eaf0' }}>Sim</span>
          </span>
          <p className="text-sm mt-2" style={{ color: '#6b7585' }}>
            {isSetup ? 'Set up your teacher PIN' : 'Enter your teacher PIN'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: '#6b7585' }}>
              {isSetup ? 'Choose a PIN' : 'PIN'}
            </label>
            <input
              type="password"
              value={pin}
              onChange={(e) => { setPin(e.target.value); setError('') }}
              placeholder="Enter PIN..."
              className="w-full px-4 py-3 rounded-lg text-base outline-none"
              style={{ background: '#2a2f3a', color: '#e8eaf0', border: '1px solid #363c4a', minHeight: 44 }}
              autoFocus
            />
          </div>

          {isSetup && (
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: '#6b7585' }}>
                Confirm PIN
              </label>
              <input
                type="password"
                value={confirmPin}
                onChange={(e) => { setConfirmPin(e.target.value); setError('') }}
                placeholder="Confirm PIN..."
                className="w-full px-4 py-3 rounded-lg text-base outline-none"
                style={{ background: '#2a2f3a', color: '#e8eaf0', border: '1px solid #363c4a', minHeight: 44 }}
              />
            </div>
          )}

          {error && <p className="text-sm" style={{ color: '#e05555' }}>{error}</p>}

          <button
            type="submit"
            className="w-full py-3 rounded-lg font-semibold cursor-pointer border-0"
            style={{ background: '#4f9cf0', color: '#fff', minHeight: 44 }}
          >
            {isSetup ? 'Set PIN' : 'Enter Dashboard'}
          </button>
        </form>

        {!isSetup && (
          <p className="text-xs text-center mt-4" style={{ color: '#6b7585' }}>
            Forgot PIN? Clear browser data (DevTools &rarr; Application &rarr; localStorage &rarr; delete chemsim_pin)
          </p>
        )}
      </div>
    </div>
  )
}
