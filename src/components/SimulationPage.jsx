import React, { useRef, useEffect, useState, useCallback } from 'react'
import { Canvas } from './Canvas'
import { VariablePanel } from './VariablePanel'
import { LiveGraph } from './LiveGraph'
import { StatusBar } from './StatusBar'
import { QuizModal } from './QuizModal'
import { ConfirmModal } from './ConfirmModal'
import { useSimulation } from '../hooks/useSimulation'
import { useGameLoop } from '../hooks/useGameLoop'
import { SIM_DEFAULTS } from '../utils/constants'

export function SimulationPage({
  reaction, module, studentName, onReactionChange,
  pendingSwitch, onConfirmSwitch, onCancelSwitch
}) {
  const canvasRef = useRef(null)
  const [particleCounts, setParticleCounts] = useState(() => getDefaultParticleCounts(reaction))
  const [showQuiz, setShowQuiz] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const lastResetRef = useRef(0)

  const {
    variables,
    updateVariable,
    stats,
    graphData,
    activeAnnotation,
    initSimulation,
    update,
    draw,
  } = useSimulation(reaction, canvasRef)

  const { pause, resume, reset, getFPS } = useGameLoop(update, draw)

  // Reset particle counts when reaction changes
  useEffect(() => {
    setParticleCounts(getDefaultParticleCounts(reaction))
  }, [reaction])

  // Initialize simulation when reaction or particle counts change
  useEffect(() => {
    if (reaction && canvasRef.current) {
      const timer = setTimeout(() => {
        initSimulation(particleCounts)
        reset()
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [reaction, particleCounts, initSimulation, reset])

  const handlePauseResume = useCallback(() => {
    if (isPaused) {
      resume()
      setIsPaused(false)
    } else {
      pause()
      setIsPaused(true)
    }
  }, [isPaused, pause, resume])

  const handleReset = useCallback(() => {
    const now = Date.now()
    if (now - lastResetRef.current < SIM_DEFAULTS.resetDebounceMs) return
    lastResetRef.current = now
    initSimulation(particleCounts)
    reset()
    setIsPaused(false)
  }, [initSimulation, particleCounts, reset])

  const quiz = module.getQuiz(reaction.id)

  return (
    <div className="flex flex-col min-h-[calc(100vh-52px)]">
      {/* Main Content: 2 columns */}
      <div className="flex flex-1 gap-0">

        {/* Left: Canvas */}
        <div className="flex-1 p-4 flex flex-col gap-3">
          <Canvas canvasRef={canvasRef} width={SIM_DEFAULTS.canvasWidth} height={SIM_DEFAULTS.canvasHeight} />

          {/* Annotation */}
          {activeAnnotation && (
            <div
              className="rounded-lg text-sm leading-relaxed"
              style={{
                background: 'rgba(34, 38, 47, 0.95)',
                border: '1px solid rgba(79, 156, 240, 0.35)',
                color: '#e8eaf0',
                padding: '10px 14px',
              }}
            >
              {activeAnnotation}
            </div>
          )}

          {/* Canvas Controls */}
          <div className="flex items-center gap-4 flex-wrap">
            <button
              onClick={handlePauseResume}
              className="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer border-0 transition-colors"
              style={{
                background: isPaused ? '#3dba7e' : '#2a2f3a',
                color: isPaused ? '#fff' : '#e8eaf0',
                border: '1px solid #363c4a',
                minHeight: 44,
              }}
            >
              {isPaused ? '\u25B6 Resume' : '\u23F8 Pause'}
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer border-0 transition-colors"
              style={{
                background: '#2a2f3a',
                color: '#e8eaf0',
                border: '1px solid #363c4a',
                minHeight: 44,
              }}
            >
              {'\u21BA'} Reset
            </button>

          </div>
        </div>

        {/* Right Panel */}
        <div className="flex flex-col gap-4 p-4 overflow-y-auto" style={{ width: 340, minWidth: 300, borderLeft: '1px solid #363c4a', maxHeight: 'calc(100vh - 52px)' }}>
          <LiveGraph data={graphData} config={reaction.graph} />
          <VariablePanel
            variables={reaction.variables}
            values={variables}
            onUpdate={updateVariable}
            particleCounts={particleCounts}
            onParticleCountsChange={setParticleCounts}
            particleTypes={reaction.particleTypes}
            initialRatio={reaction.initialRatio}
            activationEnergyKJ={reaction.activationEnergyKJ}
            activationEnergyWithCatalystKJ={reaction.activationEnergyWithCatalystKJ}
          />
        </div>
      </div>

      {/* Status Bar */}
      <div className="px-4 pb-4">
        <StatusBar stats={stats} onTakeQuiz={() => setShowQuiz(true)} />
      </div>

      {/* Quiz Modal */}
      <QuizModal
        isOpen={showQuiz}
        quiz={quiz}
        studentName={studentName}
        reactionId={reaction.id}
        onClose={() => setShowQuiz(false)}
      />

      {/* Confirm Reaction Switch Modal (from TopBar) */}
      <ConfirmModal
        isOpen={!!pendingSwitch}
        title="Switch reaction?"
        message={`Switching to ${pendingSwitch?.name || ''} will reset the simulation completely. Your current particle positions and graph data will be lost.`}
        onConfirm={onConfirmSwitch}
        onCancel={onCancelSwitch}
      />
    </div>
  )
}

function getDefaultParticleCounts(reaction) {
  if (!reaction) return {}
  const total = SIM_DEFAULTS.particleCount
  const counts = {}
  const entries = Object.entries(reaction.initialRatio)
  let remaining = total
  entries.forEach(([typeId, ratio], idx) => {
    const count = idx === entries.length - 1 ? remaining : Math.round(total * ratio)
    counts[typeId] = Math.max(0, count)
    remaining -= count
  })
  return counts
}
