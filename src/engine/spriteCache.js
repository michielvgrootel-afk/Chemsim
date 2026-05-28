// Pre-renders particle sprites to offscreen canvases for performance
// Instead of drawing complex shapes 60x/sec, we draw once and stamp the image

const cache = new Map()
let cachedDpr = 1

export function clearSpriteCache() {
  cache.clear()
  cachedDpr = window.devicePixelRatio || 1
}

export function getSprite(type, color, radius, label, shape = 'circle') {
  const dpr = cachedDpr || window.devicePixelRatio || 1
  const key = `${type}-${color}-${radius}-${shape}-${dpr}`
  if (cache.has(key)) return cache.get(key)

  const logicalSize = radius * 2 + 4
  const physicalSize = Math.ceil(logicalSize * dpr)
  const canvas = document.createElement('canvas')
  canvas.width = physicalSize
  canvas.height = physicalSize
  const ctx = canvas.getContext('2d')

  // Scale drawing to DPR for crisp rendering on HiDPI
  ctx.scale(dpr, dpr)

  const cx = logicalSize / 2
  const cy = logicalSize / 2

  // Draw shape based on type
  ctx.fillStyle = color
  ctx.strokeStyle = 'rgba(255,255,255,0.3)'
  ctx.lineWidth = 1.5

  switch (shape) {
    case 'diamond':
      ctx.beginPath()
      ctx.moveTo(cx, cy - radius)
      ctx.lineTo(cx + radius, cy)
      ctx.lineTo(cx, cy + radius)
      ctx.lineTo(cx - radius, cy)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      break

    case 'triangle':
      ctx.beginPath()
      ctx.moveTo(cx, cy - radius)
      ctx.lineTo(cx + radius * 0.87, cy + radius * 0.5)
      ctx.lineTo(cx - radius * 0.87, cy + radius * 0.5)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      break

    case 'star':
      drawStar(ctx, cx, cy, 5, radius, radius * 0.5)
      ctx.fill()
      ctx.stroke()
      break

    case 'hexagon':
      ctx.beginPath()
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 2
        const px = cx + radius * Math.cos(angle)
        const py = cy + radius * Math.sin(angle)
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      break

    case 'cracked':
      // Denatured enzyme: irregular blob with crack lines
      // Draw a wobbly, misshapen circle (unfolded protein)
      ctx.beginPath()
      const points = 12
      for (let i = 0; i <= points; i++) {
        const angle = (Math.PI * 2 / points) * i
        // Irregular radius — wobbles between 70-100% of original
        const wobble = 0.7 + 0.3 * Math.abs(Math.sin(angle * 3.7 + 1.2))
        const r = radius * wobble
        const px = cx + r * Math.cos(angle)
        const py = cy + r * Math.sin(angle)
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.closePath()
      ctx.fill()
      ctx.stroke()

      // Draw crack lines across the surface
      ctx.strokeStyle = 'rgba(40, 40, 40, 0.6)'
      ctx.lineWidth = 1.5
      // Main crack: top-left to bottom-right
      ctx.beginPath()
      ctx.moveTo(cx - radius * 0.5, cy - radius * 0.6)
      ctx.lineTo(cx - radius * 0.1, cy - radius * 0.1)
      ctx.lineTo(cx + radius * 0.15, cy + radius * 0.05)
      ctx.lineTo(cx + radius * 0.5, cy + radius * 0.55)
      ctx.stroke()
      // Branch crack
      ctx.beginPath()
      ctx.moveTo(cx - radius * 0.1, cy - radius * 0.1)
      ctx.lineTo(cx + radius * 0.4, cy - radius * 0.3)
      ctx.stroke()
      // Small branch
      ctx.beginPath()
      ctx.moveTo(cx + radius * 0.15, cy + radius * 0.05)
      ctx.lineTo(cx - radius * 0.25, cy + radius * 0.4)
      ctx.stroke()
      break

    case 'square':
      const half = radius * 0.8
      ctx.fillRect(cx - half, cy - half, half * 2, half * 2)
      ctx.strokeRect(cx - half, cy - half, half * 2, half * 2)
      break

    case 'emulsifier': {
      // Amphipathic molecule — drawn pointing RIGHT in canonical orientation
      // (renderer rotates it via p.angle so the tail points at bonded oil).
      // Layout (from left to right):
      //   - Round polar HEAD (blue, hydrophilic) — left side
      //   - Three-segment wiggly TAIL (orange, hydrophobic) — right side
      const headR = radius * 0.55
      const headX = cx - radius * 0.4
      const tailEndX = cx + radius * 0.95
      const segLen = (tailEndX - (headX + headR)) / 3

      // Tail — drawn first so the head overlaps it slightly
      ctx.strokeStyle = '#f0913a'
      ctx.lineWidth = Math.max(2.5, radius * 0.32)
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      let tx = headX + headR
      let ty = cy
      ctx.moveTo(tx, ty)
      // Zig-zag tail (visible kinks suggest hydrocarbon chain)
      ctx.lineTo(tx + segLen, cy - radius * 0.18)
      ctx.lineTo(tx + segLen * 2, cy + radius * 0.18)
      ctx.lineTo(tailEndX, cy - radius * 0.05)
      ctx.stroke()

      // Polar head — blue circle with white stroke
      ctx.fillStyle = '#5fa8f0'
      ctx.strokeStyle = 'rgba(255,255,255,0.55)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(headX, cy, headR, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()

      // Tiny "+" symbol on head to suggest partial-positive polar character
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'
      ctx.lineWidth = 1.4
      ctx.beginPath()
      ctx.moveTo(headX - headR * 0.45, cy)
      ctx.lineTo(headX + headR * 0.45, cy)
      ctx.moveTo(headX, cy - headR * 0.45)
      ctx.lineTo(headX, cy + headR * 0.45)
      ctx.stroke()
      break
    }

    default: // circle
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      break
  }

  // Draw label text on particle
  if (label) {
    ctx.fillStyle = '#fff'
    ctx.font = `bold ${Math.max(9, radius * 0.7)}px Inter, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(label, cx, cy + 0.5)
  }

  // Store logical size for reference
  canvas._logicalSize = logicalSize
  cache.set(key, canvas)
  return canvas
}

function drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
  let rot = Math.PI / 2 * 3
  const step = Math.PI / spikes

  ctx.beginPath()
  ctx.moveTo(cx, cy - outerRadius)

  for (let i = 0; i < spikes; i++) {
    ctx.lineTo(
      cx + Math.cos(rot) * outerRadius,
      cy + Math.sin(rot) * outerRadius
    )
    rot += step
    ctx.lineTo(
      cx + Math.cos(rot) * innerRadius,
      cy + Math.sin(rot) * innerRadius
    )
    rot += step
  }

  ctx.lineTo(cx, cy - outerRadius)
  ctx.closePath()
}

// Pre-render all particle types for a reaction
export function preRenderSprites(particleTypes, denatureConfig) {
  for (const pt of particleTypes) {
    getSprite(pt.type, pt.color, pt.radius || 12, pt.label, pt.shape || 'circle')
  }
  // Pre-render denatured enzyme sprite if applicable
  if (denatureConfig) {
    const enzType = particleTypes.find(pt => pt.shape === 'star')
    if (enzType) {
      getSprite(
        enzType.type + '_DEN',
        denatureConfig.denaturedColor,
        enzType.radius || 12,
        denatureConfig.denaturedLabel,
        denatureConfig.denaturedShape
      )
    }
  }
}
