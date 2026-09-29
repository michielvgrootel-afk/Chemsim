import React, { useState, useCallback, useEffect } from 'react'
import { ErrorBoundary } from './components/ErrorBoundary'
import { LoadingScreen } from './components/LoadingScreen'
import { TopBar } from './components/TopBar'
import { FrontPage } from './components/FrontPage'
import { SimulationPage } from './components/SimulationPage'
import { TeacherDashboard } from './teacher/TeacherDashboard'
import { getModule, getAllModules, getEnabledReactions, findReaction } from './modules/registry'
import { getItem } from './utils/storage'
import { SCREENS, STORAGE_KEYS, YEAR_GROUPS } from './utils/constants'

// A shared link (?reaction=<id>) preselects that simulation on the front page.
function getLinkedReactionId() {
  return new URLSearchParams(window.location.search).get('reaction')
}

export default function App() {
  const [loading, setLoading] = useState(true)
  const [currentScreen, setCurrentScreen] = useState(SCREENS.FRONT)
  const [currentReaction, setCurrentReaction] = useState(null)
  const [pendingSwitch, setPendingSwitch] = useState(null)
  const [linkedReactionId] = useState(getLinkedReactionId)
  const [activeModuleId, setActiveModuleId] = useState(
    () => findReaction(linkedReactionId)?.module.id || 'rates-of-reaction'
  )
  const [yearId, setYearId] = useState(
    () => findReaction(linkedReactionId)?.reaction.yearGroups?.[0] || YEAR_GROUPS[0].id
  )

  const module = getModule(activeModuleId)
  const allModules = getAllModules()
  const enabledIds = getItem(STORAGE_KEYS.ACTIVE_MODULES, null)

  // Simulate loading (fonts, etc.)
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  const handleStart = useCallback((reaction, moduleId, startYearId) => {
    setActiveModuleId(moduleId)
    setYearId(startYearId)
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
      const rxn = module.reactions.find(r => r.id === reactionId)
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

  // In the simulation, the top bar offers the other simulations of the same
  // topic that belong to the student's year group.
  const topBarReactions = getEnabledReactions(module, enabledIds).filter(r => r.yearGroups?.includes(yearId))

  return (
    <ErrorBoundary>
      <div className="min-h-screen" style={{ background: '#1a1d24' }}>
        {currentScreen !== SCREENS.TEACHER && (
          <TopBar
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
            reactions={topBarReactions}
            activeReactionId={currentReaction?.id}
            onReactionSwitch={handleReactionSwitch}
          />
        )}

        {currentScreen === SCREENS.FRONT && (
          <FrontPage
            modules={allModules}
            enabledIds={enabledIds}
            yearId={yearId}
            onYearChange={setYearId}
            initialReactionId={currentReaction?.id || linkedReactionId}
            onStart={handleStart}
          />
        )}

        {currentScreen === SCREENS.SIMULATION && currentReaction && (
          <SimulationPage
            reaction={currentReaction}
            module={module}
            onReactionChange={handleReactionChange}
            pendingSwitch={pendingSwitch}
            onConfirmSwitch={handleConfirmSwitch}
            onCancelSwitch={handleCancelSwitch}
          />
        )}

        {currentScreen === SCREENS.TEACHER && (
          <TeacherDashboard
            modules={allModules}
            onNavigate={handleNavigate}
          />
        )}
      </div>
    </ErrorBoundary>
  )
}
