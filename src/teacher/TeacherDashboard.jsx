import React, { useState } from 'react'
import { PinEntry } from './PinEntry'
import { ModuleManager } from './ModuleManager'
import { QuizResults } from './QuizResults'
import { AssignmentNotes } from './AssignmentNotes'
import { SCREENS } from '../utils/constants'

export function TeacherDashboard({ module, onNavigate }) {
  const [authenticated, setAuthenticated] = useState(false)
  const [activeTab, setActiveTab] = useState('modules')

  if (!authenticated) {
    return <PinEntry onSuccess={() => setAuthenticated(true)} />
  }

  const tabs = [
    { id: 'modules', label: 'Modules' },
    { id: 'results', label: 'Quiz Results' },
    { id: 'notes', label: 'Assignment Notes' },
  ]

  return (
    <div className="min-h-screen" style={{ background: '#1a1d24' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #363c4a' }}>
        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate(SCREENS.FRONT)}
            className="text-lg font-bold cursor-pointer bg-transparent border-0"
            style={{ fontFamily: 'Syne, sans-serif' }}
          >
            <span style={{ color: '#4f9cf0' }}>Chem</span>
            <span style={{ color: '#e8eaf0' }}>Sim</span>
          </button>
          <div className="w-px h-6" style={{ background: '#363c4a' }} />
          <span className="text-sm font-medium" style={{ color: '#8a95a8' }}>Teacher Dashboard</span>
        </div>
        <button
          onClick={() => onNavigate(SCREENS.FRONT)}
          className="px-4 py-2 rounded-lg text-sm cursor-pointer border-0"
          style={{ background: '#2a2f3a', color: '#8a95a8', minHeight: 44 }}
        >
          &larr; Back to App
        </button>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 px-6 pt-4">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="px-4 py-2 rounded-t-lg text-sm font-medium cursor-pointer border-0 transition-colors"
            style={{
              background: activeTab === tab.id ? '#22262f' : 'transparent',
              color: activeTab === tab.id ? '#e8eaf0' : '#6b7585',
              minHeight: 44,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mx-6 rounded-b-xl rounded-tr-xl p-6" style={{ background: '#22262f', border: '1px solid #363c4a' }}>
        {activeTab === 'modules' && <ModuleManager module={module} />}
        {activeTab === 'results' && <QuizResults />}
        {activeTab === 'notes' && <AssignmentNotes module={module} />}
      </div>
    </div>
  )
}
