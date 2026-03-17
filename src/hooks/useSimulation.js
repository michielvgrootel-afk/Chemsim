import { useRef, useState, useCallback } from 'react'
import { Particle, resetParticleIds } from '../engine/particle'
import { SpatialGrid } from '../engine/spatialGrid'
import { detectAndResolveCollisions } from '../engine/collisionDetector'
import { renderFrame } from '../engine/renderer'
import { preRenderSprites, clearSpriteCache } from '../engine/spriteCache'
import { SIM_DEFAULTS, GRAPH_CONFIG } from '../utils/constants'

export function useSimulation(reaction, canvasRef) {
  const particlesRef = useRef([])
  const gridRef = useRef(null)
  const statsRef = useRef({
    reactionCount: 0,
    reactionRate: 0,
    rateWindow: [],
    elapsed: 0,
  })
  const graphDataRef = useRef([])
  const lastGraphUpdateRef = useRef(0)
  const annotationsRef = useRef([])

  const [variables, setVariables] = useState(() => getDefaultVariables(reaction))
  const [stats, setStats] = useState({ reactionCount: 0, reactionRate: 0, elapsed: 0 })
  const [graphData, setGraphData] = useState([])
  const [activeAnnotation, setActiveAnnotation] = useState(null)
  const [allConsumed, setAllConsumed] = useState(false)

  const variablesRef = useRef(variables)
  variablesRef.current = variables

  const reactionRef = useRef(reaction)
  reactionRef.current = reaction

  const initSimulation = useCallback((particleCount = SIM_DEFAULTS.particleCount) => {
    const rxn = reactionRef.current
    if (!rxn) return

    resetParticleIds()
    clearSpriteCache()
    preRenderSprites(rxn.particleTypes)

    const canvas = canvasRef.current
    // Use logical dimensions (not DPR-scaled physical pixels)
    const width = canvas?._logicalWidth || SIM_DEFAULTS.canvasWidth
    const height = canvas?._logicalHeight || SIM_DEFAULTS.canvasHeight

    gridRef.current = new SpatialGrid(SIM_DEFAULTS.gridCellSize, width, height)

    // Particle count slider = actual number of particles spawned
    const effectiveCount = particleCount

    const particles = []
    const typeEntries = Object.entries(rxn.initialRatio)
    let remaining = effectiveCount

    typeEntries.forEach(([typeId, ratio], idx) => {
      const count = idx === typeEntries.length - 1
        ? remaining
        : Math.round(effectiveCount * ratio)
      remaining -= count

      const pType = rxn.particleTypes.find(pt => pt.type === typeId)
      if (!pType) return

      const speed = rxn.speedFromTemp ? rxn.speedFromTemp(vars.temperature) : 1

      for (let i = 0; i < Math.max(0, count); i++) {
        const p = new Particle({
          type: pType.type,
          x: Math.random() * (width - 40) + 20,
          y: Math.random() * (height - 40) + 20,
          radius: pType.radius || 12,
          color: pType.color,
          label: pType.label,
          mass: pType.mass || 1,
        })
        p.shape = pType.shape || 'circle'
        p.setRandomVelocity(speed * 60)
        particles.push(p)
      }
    })

    particlesRef.current = particles
    statsRef.current = { reactionCount: 0, reactionRate: 0, rateWindow: [], elapsed: 0 }
    graphDataRef.current = []
    lastGraphUpdateRef.current = 0
    setStats({ reactionCount: 0, reactionRate: 0, elapsed: 0 })
    setGraphData([])
    setAllConsumed(false)
  }, [canvasRef])

  const update = useCallback((dt, elapsed) => {
    const particles = particlesRef.current
    const grid = gridRef.current
    const rxn = reactionRef.current
    const vars = variablesRef.current
    if (!grid || !rxn || particles.length === 0) return

    const canvas = canvasRef.current
    // Use logical dimensions (not DPR-scaled physical pixels)
    const width = canvas?._logicalWidth || SIM_DEFAULTS.canvasWidth
    const height = canvas?._logicalHeight || SIM_DEFAULTS.canvasHeight

    // Update particle speeds based on temperature
    const targetSpeed = rxn.speedFromTemp ? rxn.speedFromTemp(vars.temperature) * 60 : 60
    for (const p of particles) {
      if (!p.alive) continue
      const currentSpeed = p.speed()
      if (currentSpeed > 0) {
        const ratio = targetSpeed / currentSpeed
        const lerp = 0.05
        p.vx *= 1 + (ratio - 1) * lerp
        p.vy *= 1 + (ratio - 1) * lerp
      }
      p.update(dt, width, height)
    }

    // Spatial grid collision detection
    grid.clear()
    for (const p of particles) {
      if (p.alive) grid.insert(p)
    }
    const collisions = detectAndResolveCollisions(grid, particles)

    // Process reactions
    const activationEnergy = rxn.activationEnergy || 0.4
    const catalystReduction = (vars.catalyst && rxn.catalystReduction) ? rxn.catalystReduction : 0
    const threshold = activationEnergy * (1 - catalystReduction) * targetSpeed * targetSpeed * 0.5

    // For reversible reactions (Haber)
    const eqModifier = rxn.equilibriumModifier ? rxn.equilibriumModifier(vars) : 1

    for (const col of collisions) {
      const { particleA, particleB, energy } = col
      if (!particleA.alive || !particleB.alive) continue

      for (const rule of rxn.reactions) {
        const isMatch = (
          (rule.reactants.includes(particleA.type) && rule.reactants.includes(particleB.type)) &&
          (particleA.type !== particleB.type || rule.reactants[0] === rule.reactants[1])
        )

        if (!isMatch) continue

        // Energy check
        let effectiveThreshold = threshold
        if (rule.isReverse) {
          effectiveThreshold = threshold * (1 / Math.max(0.1, eqModifier))
        } else if (rxn.reversible) {
          effectiveThreshold = threshold * (1 / Math.max(0.1, 1 - eqModifier + 0.5))
        }

        if (energy < effectiveThreshold) continue

        // Random chance gate for natural variation
        if (Math.random() > 0.3) continue

        // React!
        const midX = (particleA.x + particleB.x) / 2
        const midY = (particleA.y + particleB.y) / 2

        // Remove reactants (unless preserved as catalyst)
        if (rule.preserveCatalyst) {
          // Find the non-catalyst reactant and consume it
          const catalystType = rxn.particleTypes.find(pt => pt.shape === 'star')?.type
          if (particleA.type === catalystType) {
            particleB.alive = false
          } else {
            particleA.alive = false
          }
        } else {
          particleA.alive = false
          particleB.alive = false
        }

        // Create products
        for (const prodType of rule.products) {
          const pType = rxn.particleTypes.find(pt => pt.type === prodType)
          if (!pType) continue

          const p = new Particle({
            type: pType.type,
            x: midX + (Math.random() - 0.5) * 20,
            y: midY + (Math.random() - 0.5) * 20,
            radius: pType.radius || 12,
            color: pType.color,
            label: pType.label,
            mass: pType.mass || 1,
          })
          p.shape = pType.shape || 'circle'
          p.setRandomVelocity(targetSpeed * 0.5)
          p.reacting = true
          p.reactTimer = 0.3
          particles.push(p)
        }

        statsRef.current.reactionCount++
        break
      }
    }

    // Clean dead particles
    particlesRef.current = particles.filter(p => p.alive)

    // Update elapsed
    statsRef.current.elapsed = elapsed

    // Calculate reaction rate (reactions per second over last 2 seconds)
    const now = elapsed
    statsRef.current.rateWindow.push({ time: now, count: 1 })
    statsRef.current.rateWindow = statsRef.current.rateWindow.filter(w => now - w.time < 2)
    statsRef.current.reactionRate = statsRef.current.rateWindow.length / 2

    // Update graph data periodically
    if (elapsed - lastGraphUpdateRef.current >= GRAPH_CONFIG.updateIntervalMs / 1000) {
      lastGraphUpdateRef.current = elapsed
      const alive = particlesRef.current.filter(p => p.alive)
      const total = Math.max(1, alive.length)
      const counts = {}
      for (const p of alive) {
        counts[p.type] = (counts[p.type] || 0) + 1
      }

      const point = { time: Math.round(elapsed * 10) / 10 }
      for (const line of rxn.graph.lines) {
        point[line.key] = ((counts[line.key] || 0) / total * 100)
      }

      graphDataRef.current = [...graphDataRef.current.slice(-GRAPH_CONFIG.maxDataPoints), point]
      setGraphData([...graphDataRef.current])
    }

    // Check for all reactants consumed
    const reactantTypes = rxn.reactions.flatMap(r => r.reactants)
    const hasReactants = particlesRef.current.some(p => p.alive && reactantTypes.includes(p.type))
    if (!hasReactants && particlesRef.current.length > 0 && !rxn.reversible) {
      setAllConsumed(true)
    }

    // Update annotation
    const annotation = getActiveAnnotation(rxn, vars, allConsumed)
    setActiveAnnotation(annotation)

    // Periodic stats update to React state
    setStats({
      reactionCount: statsRef.current.reactionCount,
      reactionRate: Math.round(statsRef.current.reactionRate * 10) / 10,
      elapsed: Math.round(elapsed * 10) / 10,
    })
  }, [canvasRef, allConsumed])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const annotations = activeAnnotation
      ? [{ text: activeAnnotation, visible: true }]
      : []

    // Use logical dimensions since ctx is pre-scaled by DPR
    const logicalW = canvas._logicalWidth || SIM_DEFAULTS.canvasWidth
    const logicalH = canvas._logicalHeight || SIM_DEFAULTS.canvasHeight
    renderFrame(ctx, logicalW, logicalH, particlesRef.current, annotations)
  }, [canvasRef, activeAnnotation])

  const updateVariable = useCallback((id, value) => {
    setVariables(prev => ({ ...prev, [id]: value }))
  }, [])

  const getParticleCount = useCallback(() => {
    return particlesRef.current.filter(p => p.alive).length
  }, [])

  return {
    variables,
    setVariables,
    updateVariable,
    stats,
    graphData,
    activeAnnotation,
    allConsumed,
    initSimulation,
    update,
    draw,
    getParticleCount,
    particlesRef,
  }
}

function getDefaultVariables(reaction) {
  if (!reaction) return { temperature: 25, concentration: 0.5, catalyst: false }
  const vars = {}
  for (const v of reaction.variables) {
    vars[v.id] = v.default
  }
  return vars
}

function getActiveAnnotation(reaction, vars, allConsumed) {
  if (!reaction?.annotations) return null

  for (const ann of reaction.annotations) {
    if (ann.condition === 'allConsumed' && allConsumed) return ann.text
    if (ann.condition === 'always') continue
    if (typeof ann.condition === 'function' && ann.condition(vars)) return ann.text
  }

  // Default annotation
  const defaultAnn = reaction.annotations.find(a => a.condition === 'always')
  return defaultAnn?.text || null
}
