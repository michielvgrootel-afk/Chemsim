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

    case 'square':
      const half = radius * 0.8
      ctx.fillRect(cx - half, cy - half, half * 2, half * 2)
      ctx.strokeRect(cx - half, cy - half, half * 2, half * 2)
      break

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
export function preRenderSprites(particleTypes) {
  for (const pt of particleTypes) {
    getSprite(pt.type, pt.color, pt.radius || 12, pt.label, pt.shape || 'circle')
  }
}
