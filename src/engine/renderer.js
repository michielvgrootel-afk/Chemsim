// Canvas renderer - draws particles, annotations, and effects
import { getSprite } from './spriteCache'

export function renderFrame(ctx, canvasWidth, canvasHeight, particles, annotations, bgColor = '#1a1d24') {
  // Clear canvas
  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  // Draw container border
  ctx.strokeStyle = '#363c4a'
  ctx.lineWidth = 2
  ctx.strokeRect(1, 1, canvasWidth - 2, canvasHeight - 2)

  // Draw grid pattern (subtle)
  ctx.strokeStyle = 'rgba(255,255,255,0.03)'
  ctx.lineWidth = 1
  const gridSize = 50
  for (let x = gridSize; x < canvasWidth; x += gridSize) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, canvasHeight)
    ctx.stroke()
  }
  for (let y = gridSize; y < canvasHeight; y += gridSize) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(canvasWidth, y)
    ctx.stroke()
  }

  // Draw particles
  for (const p of particles) {
    if (!p.alive) continue

    ctx.save()
    ctx.globalAlpha = p.opacity

    // Draw reaction flash effect
    if (p.reacting) {
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.radius * 2, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255, 255, 255, ${p.reactTimer * 0.5})`
      ctx.fill()
    }

    // Draw cached sprite at logical size (sprite may be rendered at DPR resolution)
    const sprite = getSprite(p.type, p.color, p.radius, p.label, p.shape || 'circle')
    const logicalSize = p.radius * 2 + 4
    ctx.drawImage(
      sprite,
      p.x - logicalSize / 2,
      p.y - logicalSize / 2,
      logicalSize,
      logicalSize
    )

    ctx.restore()
  }

  // Draw annotations
  if (annotations && annotations.length > 0) {
    for (const annotation of annotations) {
      if (!annotation.visible) continue
      drawAnnotation(ctx, annotation, canvasWidth, canvasHeight)
    }
  }
}

function drawAnnotation(ctx, annotation, canvasWidth, canvasHeight) {
  const padding = 12
  const maxWidth = Math.min(400, canvasWidth * 0.6)

  ctx.font = '14px Inter, sans-serif'
  const text = annotation.text

  // Measure text for background
  const lines = wrapText(ctx, text, maxWidth - padding * 2)
  const lineHeight = 20
  const boxWidth = maxWidth
  const boxHeight = lines.length * lineHeight + padding * 2

  // Position at bottom center of canvas
  const x = (canvasWidth - boxWidth) / 2
  const y = canvasHeight - boxHeight - 16

  // Draw background
  ctx.fillStyle = 'rgba(34, 38, 47, 0.92)'
  ctx.strokeStyle = 'rgba(79, 156, 240, 0.4)'
  ctx.lineWidth = 1
  roundRect(ctx, x, y, boxWidth, boxHeight, 8)
  ctx.fill()
  ctx.stroke()

  // Draw text
  ctx.fillStyle = '#e8eaf0'
  ctx.font = '14px Inter, sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  lines.forEach((line, i) => {
    ctx.fillText(line, x + padding, y + padding + i * lineHeight)
  })
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ')
  const lines = []
  let currentLine = ''

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    if (ctx.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  }
  if (currentLine) lines.push(currentLine)
  return lines
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}
