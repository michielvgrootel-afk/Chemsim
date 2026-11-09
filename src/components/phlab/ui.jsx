import React from 'react'

// Small building blocks shared by the pH lab panels, in the app's dark style

export function Card({ title, right, children }) {
  return (
    <div className="p-3 rounded-lg space-y-3" style={{ background: '#2a2f3a' }}>
      {(title || right) && (
        <div className="flex items-center justify-between gap-2">
          {title && (
            <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6b7585' }}>
              {title}
            </h4>
          )}
          {right}
        </div>
      )}
      {children}
    </div>
  )
}

// A selectable option (substance, concentration, indicator…)
export function Chip({ active, color = '#4f9cf0', onClick, children, title, disabled }) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      aria-pressed={!!active}
      className="px-2.5 py-1.5 rounded-md text-xs font-semibold cursor-pointer border-0 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
      style={{
        background: active ? color : '#1e2535',
        color: active ? '#fff' : '#c8cdd8',
        border: `1px solid ${active ? color : '#363c4a'}`,
        minHeight: 32,
      }}
    >
      {children}
    </button>
  )
}

// A button that does something in the lab (add, pour, evaporate…)
export function ActionButton({ color = '#4f9cf0', children, active, small, className = '', ...props }) {
  const size = small ? 'px-1.5 py-1.5 text-xs whitespace-nowrap' : 'px-3 py-2 text-sm'
  return (
    <button
      {...props}
      className={`${size} rounded-lg font-semibold cursor-pointer border-0 transition-colors select-none disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
      style={{
        background: active ? color : '#1e2535',
        color: active ? '#fff' : '#e8eaf0',
        border: `2px solid ${color}`,
        minHeight: 40,
        touchAction: 'none',
      }}
    >
      {children}
    </button>
  )
}

export function Switch({ on, onChange, label }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-medium" style={{ color: '#e8eaf0' }}>{label}</span>
      <button
        onClick={() => onChange(!on)}
        className="relative w-12 h-7 rounded-full transition-colors cursor-pointer border-0 shrink-0"
        style={{ background: on ? '#4f9cf0' : '#363c4a', minHeight: 28, minWidth: 48 }}
        aria-label={`${label}: ${on ? 'On' : 'Off'}`}
      >
        <div
          className="absolute top-0.5 w-6 h-6 rounded-full bg-white transition-transform"
          style={{ transform: on ? 'translateX(22px)' : 'translateX(2px)' }}
        />
      </button>
    </div>
  )
}

export function Hint({ children }) {
  return <p className="text-xs" style={{ color: '#6b7585' }}>{children}</p>
}
