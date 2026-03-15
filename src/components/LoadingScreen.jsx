import React from 'react'

export function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#1a1d24' }}>
      <div className="text-center">
        <div className="mb-6">
          <span className="text-3xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>
            <span style={{ color: '#4f9cf0' }}>Chem</span>
            <span style={{ color: '#e8eaf0' }}>Sim</span>
          </span>
        </div>
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#4f9cf0', animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#f0913a', animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#3dba7e', animationDelay: '300ms' }} />
        </div>
        <p style={{ color: '#6b7585' }}>Loading simulation...</p>
      </div>
    </div>
  )
}
