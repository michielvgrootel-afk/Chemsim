import React, { useRef, useEffect } from 'react'

export function Canvas({ canvasRef, width = 800, height = 500 }) {
  const containerRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // High-DPI support: scale internal resolution by devicePixelRatio
    // so the canvas is crisp on Retina/HiDPI screens
    const dpr = window.devicePixelRatio || 1

    // Internal pixel buffer at full device resolution
    canvas.width = width * dpr
    canvas.height = height * dpr

    // CSS display size stays at logical pixels
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`

    // Scale the drawing context so all draw calls use logical coordinates
    const ctx = canvas.getContext('2d')
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    // Store logical dimensions for simulation math
    canvas._logicalWidth = width
    canvas._logicalHeight = height
    canvas._dpr = dpr
  }, [canvasRef, width, height])

  // Re-apply DPI scaling if the window moves between monitors with different DPR
  useEffect(() => {
    const mq = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`)
    const handleChange = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const dpr = window.devicePixelRatio || 1
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      const ctx = canvas.getContext('2d')
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      canvas._dpr = dpr
    }
    mq.addEventListener?.('change', handleChange)
    return () => mq.removeEventListener?.('change', handleChange)
  }, [canvasRef, width, height])

  return (
    <div ref={containerRef} className="relative" style={{ maxWidth: width }}>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: 'auto',
          aspectRatio: `${width} / ${height}`,
          borderRadius: 8,
          display: 'block',
          background: '#1a1d24',
        }}
      />
    </div>
  )
}
