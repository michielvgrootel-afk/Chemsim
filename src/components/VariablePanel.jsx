import React from 'react'

const ICONS = {
  thermometer: '\uD83C\uDF21\uFE0F',
  flask: '\u2697\uFE0F',
  zap: '\u26A1',
}

export function VariablePanel({ variables, values, onUpdate, particleCount, onParticleCountChange, minParticles, maxParticles, activationEnergyKJ, activationEnergyWithCatalystKJ }) {
  if (!variables) return null

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#6b7585' }}>
        Variables
      </h3>

      {/* Particle count slider */}
      {onParticleCountChange && (
        <div className="p-3 rounded-lg" style={{ background: '#2a2f3a' }}>
          <SliderControl
            variable={{
              id: '_particles',
              label: 'Particles',
              icon: 'flask',
              min: minParticles || 10,
              max: maxParticles || 100,
              step: 1,
              unit: '',
              tooltip: 'Number of reactant particles in the simulation',
            }}
            value={particleCount}
            onUpdate={(_, val) => onParticleCountChange(val)}
          />
        </div>
      )}

      {variables.map(v => (
        <div key={v.id} className="p-3 rounded-lg" style={{ background: '#2a2f3a' }}>
          {v.type === 'toggle' ? (
            <ToggleControl variable={v} value={values[v.id]} onUpdate={onUpdate} />
          ) : (
            <SliderControl variable={v} value={values[v.id]} onUpdate={onUpdate} />
          )}
        </div>
      ))}

      {/* Activation Energy Display */}
      {activationEnergyKJ != null && (
        <ActivationEnergyCard
          activationEnergyKJ={activationEnergyKJ}
          activationEnergyWithCatalystKJ={activationEnergyWithCatalystKJ}
          catalystActive={variables.some(v => v.id === 'catalyst') ? !!values.catalyst : true}
        />
      )}
    </div>
  )
}

function SliderControl({ variable, value, onUpdate }) {
  const v = variable
  const displayValue = typeof value === 'number' ? value : v.default

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-base">{ICONS[v.icon] || ''}</span>
          <span className="text-sm font-medium" style={{ color: '#e8eaf0' }}>{v.label}</span>
        </div>
        <span className="text-sm font-mono font-semibold" style={{ color: '#4f9cf0' }}>
          {typeof displayValue === 'number' ? (Number.isInteger(v.step) ? displayValue : displayValue.toFixed(1)) : displayValue} {v.unit}
        </span>
      </div>
      <input
        type="range"
        min={v.min}
        max={v.max}
        step={v.step}
        value={displayValue}
        onChange={(e) => onUpdate(v.id, parseFloat(e.target.value))}
        className="w-full"
        style={{ minHeight: 44 }}
        aria-label={v.label}
      />
      <div className="flex justify-between mt-1">
        <span className="text-xs" style={{ color: '#6b7585' }}>{v.min} {v.unit}</span>
        <span className="text-xs" style={{ color: '#6b7585' }}>{v.max} {v.unit}</span>
      </div>
      {v.tooltip && (
        <p className="text-xs mt-2" style={{ color: '#6b7585' }}>{v.tooltip}</p>
      )}
    </div>
  )
}

function ActivationEnergyCard({ activationEnergyKJ, activationEnergyWithCatalystKJ, catalystActive }) {
  return (
    <div className="p-3 rounded-lg" style={{ background: '#2a2f3a' }}>
      <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#6b7585' }}>
        Activation Energy
      </h4>
      <div className="space-y-2">
        <div
          className="flex items-center justify-between px-3 py-2 rounded"
          style={{
            background: !catalystActive ? '#1e2535' : '#22262f',
            border: !catalystActive ? '1px solid #4f9cf0' : '1px solid transparent',
          }}
        >
          <span className="text-xs" style={{ color: !catalystActive ? '#e8eaf0' : '#6b7585' }}>
            Without catalyst
          </span>
          <span className="text-sm font-mono font-semibold" style={{ color: !catalystActive ? '#f0913a' : '#6b7585' }}>
            {activationEnergyKJ} kJ/mol
          </span>
        </div>
        {activationEnergyWithCatalystKJ != null && (
          <div
            className="flex items-center justify-between px-3 py-2 rounded"
            style={{
              background: catalystActive ? '#1e2535' : '#22262f',
              border: catalystActive ? '1px solid #4f9cf0' : '1px solid transparent',
            }}
          >
            <span className="text-xs" style={{ color: catalystActive ? '#e8eaf0' : '#6b7585' }}>
              With catalyst
            </span>
            <span className="text-sm font-mono font-semibold" style={{ color: catalystActive ? '#3dba7e' : '#6b7585' }}>
              {activationEnergyWithCatalystKJ} kJ/mol
            </span>
          </div>
        )}
        {activationEnergyWithCatalystKJ != null && (
          <p className="text-xs mt-1" style={{ color: '#6b7585' }}>
            Reduction: {Math.round((1 - activationEnergyWithCatalystKJ / activationEnergyKJ) * 100)}%
          </p>
        )}
      </div>
    </div>
  )
}

function ToggleControl({ variable, value, onUpdate }) {
  const v = variable
  const isOn = !!value

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">{ICONS[v.icon] || ''}</span>
          <span className="text-sm font-medium" style={{ color: '#e8eaf0' }}>{v.label}</span>
        </div>
        <button
          onClick={() => onUpdate(v.id, !isOn)}
          className="relative w-12 h-7 rounded-full transition-colors cursor-pointer border-0"
          style={{
            background: isOn ? '#4f9cf0' : '#363c4a',
            minHeight: 28,
            minWidth: 48,
          }}
          aria-label={`${v.label}: ${isOn ? 'On' : 'Off'}`}
        >
          <div
            className="absolute top-0.5 w-6 h-6 rounded-full bg-white transition-transform"
            style={{
              transform: isOn ? 'translateX(22px)' : 'translateX(2px)',
            }}
          />
        </button>
      </div>
      {v.tooltip && (
        <p className="text-xs mt-2" style={{ color: '#6b7585' }}>{v.tooltip}</p>
      )}
    </div>
  )
}
