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
  const [particleCount, setParticleCount] = useState(SIM_DEFAULTS.particleCount)
  const [showQuiz, setShowQuiz] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const lastResetRef = useRef(0)

  const {
    variables,
    updateVariable,
    stats,
    graphData,
    initSimulation,
    update,
    draw,
  } = useSimulation(reaction, canvasRef)

  const { pause, resume, reset, getFPS } = useGameLoop(update, draw)

  // Initialize simulation when reaction or particle count changes
  useEffect(() => {
    if (reaction && canvasRef.current) {
      const timer = setTimeout(() => {
        initSimulation(particleCount)
        reset()
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [reaction, particleCount, initSimulation, reset])

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
    initSimulation(particleCount)
    reset()
    setIsPaused(false)
  }, [initSimulation, particleCount, reset])

  const quiz = module.getQuiz(reaction.id)

  return (
    <div className="flex flex-col min-h-[calc(100vh-52px)]">
      {/* Main Content: 2 columns */}
      <div className="flex flex-1 gap-0">

        {/* Left: Canvas */}
        <div className="flex-1 p-4 flex flex-col gap-3">
          <Canvas canvasRef={canvasRef} width={SIM_DEFAULTS.canvasWidth} height={SIM_DEFAULTS.canvasHeight} />

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

            {/* Particle count slider - visually separated */}
            <div className="ml-auto flex items-center gap-3 px-3 py-1 rounded-lg" style={{ background: '#2a2f3a', border: '1px solid #363c4a' }}>
              <span className="text-xs" style={{ color: '#6b7585' }}>Particles</span>
              <input
                type="range"
                min={SIM_DEFAULTS.minParticles}
                max={SIM_DEFAULTS.maxParticles}
                value={particleCount}
                onChange={(e) => setParticleCount(parseInt(e.target.value))}
                className="w-24"
                aria-label="Particle count"
              />
              <span className="text-sm font-mono w-8 text-center" style={{ color: '#4f9cf0' }}>{particleCount}</span>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex flex-col gap-4 p-4 overflow-y-auto" style={{ width: 340, minWidth: 300, borderLeft: '1px solid #363c4a' }}>
          <LiveGraph data={graphData} config={reaction.graph} />
          <VariablePanel
            variables={reaction.variables}
            values={variables}
            onUpdate={updateVariable}
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
