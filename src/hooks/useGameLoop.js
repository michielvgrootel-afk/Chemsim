import { useRef, useEffect, useCallback } from 'react'
import { GameLoop } from '../engine/gameLoop'

export function useGameLoop(updateFn, drawFn) {
  const loopRef = useRef(null)
  const updateRef = useRef(updateFn)
  const drawRef = useRef(drawFn)

  // Keep refs current
  updateRef.current = updateFn
  drawRef.current = drawFn

  useEffect(() => {
    const loop = new GameLoop(
      (dt, elapsed) => updateRef.current(dt, elapsed),
      () => drawRef.current()
    )
    loopRef.current = loop
    loop.start()

    return () => {
      loop.stop()
    }
  }, [])

  const pause = useCallback(() => loopRef.current?.pause(), [])
  const resume = useCallback(() => loopRef.current?.resume(), [])
  const reset = useCallback(() => loopRef.current?.reset(), [])

  const getElapsed = useCallback(() => loopRef.current?.elapsed || 0, [])
  const getFPS = useCallback(() => loopRef.current?.fps || 0, [])
  const isPaused = useCallback(() => loopRef.current?.paused || false, [])

  return { pause, resume, reset, getElapsed, getFPS, isPaused, loopRef }
}
