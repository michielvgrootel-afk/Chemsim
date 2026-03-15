import React, { useState, useCallback, useEffect, useRef } from 'react'
import { ErrorBoundary } from './components/ErrorBoundary'
import { LoadingScreen } from './components/LoadingScreen'
import { TopBar } from './components/TopBar'
import { FrontPage } from './components/FrontPage'
import { SimulationPage } from './components/SimulationPage'
import { TeacherDashboard } from './teacher/TeacherDashboard'
import { getModule } from './modules/registry'
import { getItem } from './utils/storage'
import { SCREENS, STORAGE_KEYS } from './utils/constants'

export default function App() {
  const [loading, setLoading] = useState(true)
  const [currentScreen, setCurrentScreen] = useState(SCREENS.FRONT)
  const [studentName, setStudentName] = useState('')
  const [currentReaction, setCurrentReaction] = useState(null)
  const [pendingSwitch, setPendingSwitch] = useState(null)

  const module = getModule('rates-of-reaction')
  const activeModules = getItem(STORAGE_KEYS.ACTIVE_MODULES, module.reactions.map(r => r.id))

  // Simulate loading (fonts, etc.)
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  // Check URL params for direct reaction link
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const reactionId = params.get('reaction')
    if (reactionId) {
      const rxn = module.getReaction(reactionId)
      if (rxn) setCurrentReaction(rxn)
    }
  }, [module])

  const handleStart = useCallback((name, reaction) => {
    setStudentName(name)
    setCurrentReaction(reaction)
    setCurrentScreen(SCREENS.SIMULATION)
  }, [])

  const handleNavigate = useCallback((screen) => {
    setCurrentScreen(screen)
  }, [])

  const handleReactionChange = useCallback((reaction) => {
    setCurrentReaction(reaction)
  }, [])

  // TopBar requests a switch — if in simulation, set pending (SimulationPage shows confirm)
  const handleReactionSwitch = useCallback((reactionId) => {
    if (currentScreen === SCREENS.SIMULATION && currentReaction && reactionId !== currentReaction.id) {
      const rxn = module.getReaction(reactionId)
      if (rxn) setPendingSwitch(rxn)
    }
  }, [currentScreen, currentReaction, module])

  // SimulationPage confirmed the switch
  const handleConfirmSwitch = useCallback(() => {
    if (pendingSwitch) {
      setCurrentReaction(pendingSwitch)
      setPendingSwitch(null)
    }
  }, [pendingSwitch])

  const handleCancelSwitch = useCallback(() => {
    setPendingSwitch(null)
  }, [])

  if (loading) return <LoadingScreen />

  return (
    <ErrorBoundary>
      <div className="min-h-screen" style={{ background: '#1a1d24' }}>
        {currentScreen !== SCREENS.TEACHER && (
          <TopBar
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
            studentName={studentName}
            reactions={module.reactions.filter(r => activeModules.includes(r.id))}
            activeReactionId={currentReaction?.id}
            onReactionSwitch={handleReactionSwitch}
          />
        )}

        {currentScreen === SCREENS.FRONT && (
          <FrontPage
            module={module}
            onStart={handleStart}
            activeModules={activeModules}
          />
        )}

        {currentScreen === SCREENS.SIMULATION && currentReaction && (
          <SimulationPage
            reaction={currentReaction}
            module={module}
            studentName={studentName}
            onReactionChange={handleReactionChange}
            pendingSwitch={pendingSwitch}
            onConfirmSwitch={handleConfirmSwitch}
            onCancelSwitch={handleCancelSwitch}
          />
        )}

        {currentScreen === SCREENS.TEACHER && (
          <TeacherDashboard
            module={module}
            onNavigate={handleNavigate}
          />
        )}
      </div>
    </ErrorBoundary>
  )
}
