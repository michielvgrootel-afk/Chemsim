// Game loop using requestAnimationFrame
// Separates update phase from draw phase as per Technical Brief
// Falls back to setTimeout when tab is hidden (rAF is suspended in hidden tabs)

export class GameLoop {
  constructor(updateFn, drawFn) {
    this.updateFn = updateFn
    this.drawFn = drawFn
    this.running = false
    this.paused = false
    this.lastTime = 0
    this.elapsed = 0 // total simulation time in seconds
    this.frameId = null
    this._fallbackTimer = null
    this.fps = 60
    this._fpsFrames = 0
    this._fpsTime = 0

    // Handle tab visibility
    this._onVisibilityChange = this._onVisibilityChange.bind(this)
    this._loop = this._loop.bind(this)
    this._fallbackLoop = this._fallbackLoop.bind(this)
  }

  start() {
    if (this.running) return
    this.running = true
    this.paused = false
    this.lastTime = performance.now()
    this._fpsTime = this.lastTime
    document.addEventListener('visibilitychange', this._onVisibilityChange)
    this._scheduleNext()
  }

  stop() {
    this.running = false
    this._cancelScheduled()
    document.removeEventListener('visibilitychange', this._onVisibilityChange)
  }

  pause() {
    this.paused = true
  }

  resume() {
    if (this.paused) {
      this.paused = false
      this.lastTime = performance.now()
    }
  }

  reset() {
    this.elapsed = 0
    this.fps = 60
  }

  _scheduleNext() {
    // Use rAF when visible, setTimeout fallback when hidden
    if (document.hidden) {
      this._fallbackTimer = setTimeout(this._fallbackLoop, 16)
    } else {
      this.frameId = requestAnimationFrame(this._loop)
    }
  }

  _cancelScheduled() {
    if (this.frameId) {
      cancelAnimationFrame(this.frameId)
      this.frameId = null
    }
    if (this._fallbackTimer) {
      clearTimeout(this._fallbackTimer)
      this._fallbackTimer = null
    }
  }

  _fallbackLoop() {
    this._fallbackTimer = null
    if (!this.running) return
    this._tick(performance.now())
    this._scheduleNext()
  }

  _loop(now) {
    this.frameId = null
    if (!this.running) return
    this._tick(now)
    this._scheduleNext()
  }

  _tick(now) {
    const rawDt = (now - this.lastTime) / 1000
    // Cap delta time to prevent huge jumps (e.g. after tab switch)
    const dt = Math.min(rawDt, 0.05)
    this.lastTime = now

    // FPS calculation
    this._fpsFrames++
    if (now - this._fpsTime >= 1000) {
      this.fps = this._fpsFrames
      this._fpsFrames = 0
      this._fpsTime = now
    }

    if (!this.paused) {
      this.elapsed += dt
      // 1. Update phase
      this.updateFn(dt, this.elapsed)
    }

    // 2. Draw phase (always draw, even when paused)
    this.drawFn()
  }

  _onVisibilityChange() {
    // Reset timing to prevent huge dt jumps after tab switch
    this.lastTime = performance.now()
    this._fpsTime = this.lastTime
    this._fpsFrames = 0
    // Switch between rAF (visible) and setTimeout fallback (hidden)
    this._cancelScheduled()
    this._scheduleNext()
  }
}
