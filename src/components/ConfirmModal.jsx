import React from 'react'

export function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmLabel = 'Switch & Reset', cancelLabel = 'Cancel' }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={onCancel}
    >
      <div
        className="rounded-xl p-6 w-full"
        style={{ background: '#22262f', border: '1px solid #363c4a', maxWidth: 420 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="text-3xl mb-3">&#x26A0;&#xFE0F;</div>
        <h3 className="text-lg font-semibold mb-2" style={{ color: '#e8eaf0' }}>{title}</h3>
        <p className="text-sm mb-6" style={{ color: '#8a95a8' }}>{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2.5 rounded-lg text-sm font-medium cursor-pointer border-0"
            style={{ background: '#2a2f3a', color: '#8a95a8', minHeight: 44 }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold cursor-pointer border-0"
            style={{ background: '#e05555', color: '#fff', minHeight: 44 }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
