import { useRef, useState, useCallback } from 'react'
import { Particle, resetParticleIds } from '../engine/particle'
import { SpatialGrid } from '../engine/spatialGrid'
import { detectAndResolveCollisions } from '../engine/collisionDetector'
import { renderFrame } from '../engine/renderer'
import { preRenderSprites, clearSpriteCache } from '../engine/spriteCache'
import { CatalystSurface } from '../engine/catalystSurface'
import { applyPolarityForces, applyStirring, calcDissolutionPercent, calcLatticeDissolutionPercent, calcSeparationPercent } from '../engine/polarityForces'
import { spawnEmulsifiers, despawnEmulsifiers, updateEmulsifierBonds } from '../engine/emulsifier'
import { SIM_DEFAULTS, GRAPH_CONFIG } from '../utils/constants'

export function useSimulation(reaction, canvasRef) {
  const particlesRef = useRef([])
  const gridRef = useRef(null)
  const catalystRef = useRef(null)
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
  const [allDenatured, setAllDenatured] = useState(false)
  const [enzymeStats, setEnzymeStats] = useState(null)
  const [dissolutionStats, setDissolutionStats] = useState(null)
  const clusterCenterRef = useRef(null)
  const lastHydrationCheckRef = useRef(0)

  const variablesRef = useRef(variables)
  variablesRef.current = variables

  const reactionRef = useRef(reaction)
  reactionRef.current = reaction

  const reactantTypesRef = useRef([])
  if (reaction) {
    reactantTypesRef.current = reaction.reactions.flatMap(r => r.reactants)
  }

  const initSimulation = useCallback((particleCounts = {}) => {
    const rxn = reactionRef.current
    if (!rxn) return

    resetParticleIds()
    clearSpriteCache()
    preRenderSprites(rxn.particleTypes, rxn.denature)

    const canvas = canvasRef.current
    // Use logical dimensions (not DPR-scaled physical pixels)
    const width = canvas?._logicalWidth || SIM_DEFAULTS.canvasWidth
    const height = canvas?._logicalHeight || SIM_DEFAULTS.canvasHeight

    gridRef.current = new SpatialGrid(SIM_DEFAULTS.gridCellSize, width, height)

    // Initialize catalyst surface if reaction supports it
    if (rxn.hasCatalystSurface) {
      const vars = variablesRef.current
      catalystRef.current = new CatalystSurface(width, height, !!vars.catalyst)
    } else {
      catalystRef.current = null
    }

    const vars = variablesRef.current

    // Constrain spawn area above catalyst barrier if active
    const spawnFloor = catalystRef.current?.active
      ? catalystRef.current.y - 20
      : height - 20

    const particles = []
    const speed = rxn.speedFromTemp ? rxn.speedFromTemp(vars.temperature) : 1

    // Solubility spawn modes
    if (rxn.hasPolarityForces && rxn.spawnMode === 'lattice' && rxn.latticeConfig) {
      // Spawn solute in a crystal lattice grid
      const lc = rxn.latticeConfig
      const centerX = width * lc.offsetX
      const centerY = height * lc.offsetY
      const startX = centerX - (lc.cols - 1) * lc.spacing / 2
      const startY = centerY - (lc.rows - 1) * lc.spacing / 2

      for (let row = 0; row < lc.rows; row++) {
        for (let col = 0; col < lc.cols; col++) {
          const typeIdx = (row + col) % lc.types.length
          const typeId = lc.types[typeIdx]
          const pType = rxn.particleTypes.find(pt => pt.type === typeId)
          if (!pType) continue
          const p = createParticle(pType, startX + col * lc.spacing, startY + row * lc.spacing)
          if (lc.bound) {
            p.bound = true
            p.latticeIon = true
            p.dissolved = false  // one-way flag: flips true on first hydration release
            p.vx = 0
            p.vy = 0
          } else {
            p.vx = (Math.random() - 0.5) * speed * 10
            p.vy = (Math.random() - 0.5) * speed * 10
          }
          particles.push(p)
        }
      }
      clusterCenterRef.current = { x: centerX, y: centerY }

      // Fill remaining space with solvent
      const solventTypes = rxn.solventTypes || []
      const soluteCount = particles.length
      const solventCount = lc.solventCount || Math.max(0, (particleCounts[solventTypes[0]] || 30) - 0)
      for (let i = 0; i < solventCount; i++) {
        const typeId = solventTypes[i % solventTypes.length] || solventTypes[0]
        const pType = rxn.particleTypes.find(pt => pt.type === typeId)
        if (!pType) continue
        let x, y
        // Keep solvent away from lattice initially
        const exclX = lc.cols * lc.spacing / 2 + 30
        const exclY = lc.rows * lc.spacing / 2 + 30
        do {
          x = Math.random() * (width - 40) + 20
          y = Math.random() * (height - 40) + 20
        } while (Math.abs(x - clusterCenterRef.current.x) < exclX && Math.abs(y - clusterCenterRef.current.y) < exclY)
        const p = createParticle(pType, x, y)
        const solventSpeed = lc.bound ? speed * 30 : speed * 60 // Slower for lattice scenarios
        p.setRandomVelocity(solventSpeed)
        particles.push(p)
      }
    } else if (rxn.hasPolarityForces && rxn.spawnMode === 'cluster' && rxn.clusterConfig) {
      // Spawn solute in a tight cluster
      const cc = rxn.clusterConfig
      const centerX = width * cc.offsetX
      const centerY = height * cc.offsetY
      clusterCenterRef.current = { x: centerX, y: centerY }

      for (const typeId of cc.types) {
        const count = particleCounts[typeId] || 10
        const pType = rxn.particleTypes.find(pt => pt.type === typeId)
        if (!pType) continue
        for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2
          const dist = Math.random() * cc.radius
          const p = createParticle(pType, centerX + Math.cos(angle) * dist, centerY + Math.sin(angle) * dist)
          p.vx = (Math.random() - 0.5) * speed * 15
          p.vy = (Math.random() - 0.5) * speed * 15
          particles.push(p)
        }
      }

      // Fill with solvent
      const solventTypes = rxn.solventTypes || []
      for (const typeId of solventTypes) {
        const count = particleCounts[typeId] || 30
        const pType = rxn.particleTypes.find(pt => pt.type === typeId)
        if (!pType) continue
        for (let i = 0; i < count; i++) {
          let x, y
          do {
            x = Math.random() * (width - 40) + 20
            y = Math.random() * (height - 40) + 20
          } while (Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2) < cc.radius + 20)
          const p = createParticle(pType, x, y)
          p.setRandomVelocity(speed * 60)
          particles.push(p)
        }
      }
    } else if (rxn.hasPolarityForces && rxn.spawnMode === 'mixed') {
      // Spawn all particles randomly mixed (for immiscible scenarios)
      clusterCenterRef.current = { x: width / 2, y: height / 2 }
      for (const [typeId, count] of Object.entries(particleCounts)) {
        const pType = rxn.particleTypes.find(pt => pt.type === typeId)
        if (!pType) continue
        for (let i = 0; i < Math.max(0, count); i++) {
          const p = createParticle(pType, Math.random() * (width - 40) + 20, Math.random() * (height - 40) + 20)
          p.setRandomVelocity(speed * 60)
          particles.push(p)
        }
      }
    } else {
      // Default spawn (rates-of-reaction style)
      for (const [typeId, count] of Object.entries(particleCounts)) {
        const pType = rxn.particleTypes.find(pt => pt.type === typeId)
        if (!pType) continue
        for (let i = 0; i < Math.max(0, count); i++) {
          const p = createParticle(pType, Math.random() * (width - 40) + 20, Math.random() * (spawnFloor - 20) + 20)
          p.setRandomVelocity(speed * 60)
          particles.push(p)
        }
      }
    }

    particlesRef.current = particles
    statsRef.current = { reactionCount: 0, reactionRate: 0, rateWindow: [], elapsed: 0 }
    graphDataRef.current = []
    lastGraphUpdateRef.current = 0
    setStats({ reactionCount: 0, reactionRate: 0, elapsed: 0 })
    setGraphData([])
    setAllConsumed(false)
    setAllDenatured(false)
    setEnzymeStats(null)
    setDissolutionStats(null)
    lastHydrationCheckRef.current = 0
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

    // Handle catalyst surface toggle
    const catalyst = catalystRef.current
    if (catalyst && rxn.hasCatalystSurface) {
      if (vars.catalyst && !catalyst.active) {
        // Toggled ON — activate surface, push particles above barrier
        catalyst.active = true
        for (const p of particles) {
          if (p.alive && p.y + p.radius > catalyst.y) {
            p.y = catalyst.y - p.radius - 5
            p.vy = -Math.abs(p.vy || 1)
          }
        }
      } else if (!vars.catalyst && catalyst.active) {
        // Toggled OFF — release all bound particles
        const targetSpeed = rxn.speedFromTemp ? rxn.speedFromTemp(vars.temperature) * 60 : 60
        catalyst.releaseAll(targetSpeed)
        catalyst.active = false
      }
    }

    const effectiveFloor = catalyst?.active ? catalyst.getEffectiveFloor() : null

    // Handle emulsifier toggle — spawn/despawn amphipathic molecules that
    // bind oil + water together (used in oil-water scenario).
    if (rxn.emulsifierConfig) {
      const ec = rxn.emulsifierConfig
      const emulType = rxn.particleTypes.find(pt => pt.type === 'EMUL')
      const existingEmuls = particles.filter(p => p.alive && p.type === 'EMUL')
      const spawnSpeed = rxn.speedFromTemp ? rxn.speedFromTemp(vars.temperature) * 60 : 60

      if (vars.emulsifier && existingEmuls.length === 0 && emulType) {
        // Toggled ON — spawn fresh emulsifiers
        spawnEmulsifiers(particles, createParticle, emulType, ec.count, width, height, spawnSpeed)
      } else if (!vars.emulsifier && existingEmuls.length > 0) {
        // Toggled OFF — kill them and unbond their partners
        despawnEmulsifiers(particles)
      }
    }

    // Update particle speeds based on temperature
    const targetSpeed = rxn.speedFromTemp ? rxn.speedFromTemp(vars.temperature) * 60 : 60
    for (const p of particles) {
      if (!p.alive) continue
      if (p.bound) {
        p.update(dt, width, height, effectiveFloor)
        continue
      }
      const currentSpeed = p.speed()
      if (currentSpeed > 0) {
        const ratio = targetSpeed / currentSpeed
        const lerp = 0.05
        p.vx *= 1 + (ratio - 1) * lerp
        p.vy *= 1 + (ratio - 1) * lerp
      }
      p.update(dt, width, height, effectiveFloor)
    }

    // Binding pass: check free particles near catalyst surface
    if (catalyst?.active) {
      for (const p of particles) {
        if (!p.alive || p.bound) continue
        catalyst.tryBind(p)
      }
      // Surface diffusion — bound particles drift toward complementary neighbors
      catalyst.diffuse()
      // Thermal desorption — prevent surface saturation over time
      catalyst.desorb(dt, targetSpeed)
    }

    // Enzyme denaturing (fermentation)
    const denatureConfig = rxn.denature
    if (denatureConfig) {
      const temp = vars.temperature
      if (temp >= denatureConfig.startTemp) {
        // Calculate denaturing probability based on temperature
        const tempFraction = Math.min(1, (temp - denatureConfig.startTemp) / (denatureConfig.fullTemp - denatureConfig.startTemp))
        const rate = denatureConfig.ratePerSecond + tempFraction * (denatureConfig.maxRate - denatureConfig.ratePerSecond)
        const probability = rate * dt

        for (const p of particles) {
          if (!p.alive || p.denatured || p.shape !== 'star') continue
          if (Math.random() < probability) {
            // Denature this enzyme
            p.denatured = true
            p.color = denatureConfig.denaturedColor
            p.shape = denatureConfig.denaturedShape
            p.label = denatureConfig.denaturedLabel
            // Flash effect to make it visible
            p.reacting = true
            p.reactTimer = 0.5
          }
        }
      }

      // Track enzyme stats
      const enzType = rxn.particleTypes.find(pt => pt.shape === 'star')
      if (enzType) {
        const allEnz = particles.filter(p => p.alive && (p.type === enzType.type))
        const active = allEnz.filter(p => !p.denatured).length
        const total = allEnz.length
        setEnzymeStats({ active, total })
        if (total > 0 && active === 0) {
          setAllDenatured(true)
        }
      }
    }

    // Spatial grid — insert free particles + lattice ions (for hydration neighbor lookup)
    grid.clear()
    for (const p of particles) {
      if (p.alive && (!p.bound || p.latticeIon)) grid.insert(p)
    }

    // Apply polarity forces (solubility simulation)
    if (rxn.hasPolarityForces) {
      applyPolarityForces(particles, grid, dt, {
        soluteTypes: rxn.soluteTypes || [],
        ...rxn.polarityConfig,
      })

      // Hydration-based dissolution (REVERSIBLE GATING + EXCLUSIVE BONDS):
      //   - Each water "bonds" to its single nearest ion within the shell radius.
      //     Other ions ignore that water (no tug-of-war), and the polarity force
      //     loop only pulls a water toward its bonded ion. This produces stable,
      //     well-defined hydration shells instead of waters being shared.
      //   - An ion's shell size = number of waters whose bondedIonId === ion.id.
      //   - Ion can move (bound=false) ONLY while shell size >= per-type threshold.
      //   - If the shell drops below threshold, ion freezes (bound=true, vx=vy=0)
      //     and stays frozen until its shell is rebuilt.
      //   - p.dissolved is a one-way flag: set true the first time an ion releases.
      //     The dissolution % counter reads p.dissolved so it doesn't flicker as
      //     shells fluctuate.
      //   - latticeIon stays true permanently so ion-dipole attraction keeps
      //     working after release (the hydration shell travels with the ion).
      if (rxn.hydrationConfig) {
        const hc = rxn.hydrationConfig
        if (elapsed - lastHydrationCheckRef.current > hc.checkInterval) {
          lastHydrationCheckRef.current = elapsed
          const solventTypes = rxn.solventTypes || []
          const soluteTypes = rxn.soluteTypes || []
          const radiusSq = hc.radius * hc.radius
          // Temperature modulates threshold slightly: hotter water dislodges easier
          const tempFactor = 1 + (vars.temperature - 25) / 200
          const speed = rxn.speedFromTemp(vars.temperature)
          const perTypeThresholds = hc.thresholds || {}

          // Step 1: each water picks its single nearest ion within shell radius.
          //          If no ion is within radius, the water is unbonded.
          //          Bonds persist between checks — they're only reassigned here.
          const shellCounts = new Map()
          for (const w of particles) {
            if (!w.alive || !solventTypes.includes(w.type)) continue
            let bestIonId = null
            let bestDistSq = radiusSq
            const nearby = grid.getNearby(w)
            for (const o of nearby) {
              if (!o.alive || !soluteTypes.includes(o.type)) continue
              const dx = w.x - o.x, dy = w.y - o.y
              const dsq = dx * dx + dy * dy
              if (dsq < bestDistSq) {
                bestDistSq = dsq
                bestIonId = o.id
              }
            }
            w.bondedIonId = bestIonId
            if (bestIonId != null) {
              shellCounts.set(bestIonId, (shellCounts.get(bestIonId) || 0) + 1)
            }
          }

          // Step 2: gate each ion's mobility based on its (exclusive) shell size.
          for (const p of particles) {
            if (!p.alive || !soluteTypes.includes(p.type)) continue
            const baseThreshold = perTypeThresholds[p.type] ?? hc.threshold
            const effectiveThreshold = Math.max(1, Math.round(baseThreshold / tempFactor))
            const waterCount = shellCounts.get(p.id) || 0

            if (waterCount >= effectiveThreshold) {
              // Properly hydrated — ion can move
              if (p.bound) {
                p.bound = false
                if (!p.dissolved) {
                  // First-ever release: ion breaks away from the lattice
                  p.dissolved = true
                  p.setRandomVelocity(speed * 30)
                }
                // On subsequent re-releases we leave velocity alone — it will be
                // picked up by ion-dipole forces and water collisions naturally.
              }
            } else {
              // Hydration shell too thin — ion is frozen until rebuilt
              p.bound = true
              p.vx = 0
              p.vy = 0
            }
          }
        }
      }

      // Stirring — applied every frame so the sweeping spoon motion is
      // continuous and looks like a real fluid being mixed. The previous
      // throttled-jitter approach is gone (only added wiggle, not flow).
      if (vars.stirring) {
        applyStirring(particles, dt, elapsed, width, height, 1)
      }

      // Emulsifier bond dynamics — every frame, each emulsifier seeks
      // unclaimed oil + water partners within range and applies a spring
      // force to keep them at the ideal bond distance. Bonds persist
      // through stirring, so the mixed state is stable.
      if (rxn.emulsifierConfig && vars.emulsifier) {
        updateEmulsifierBonds(particles, grid, dt, rxn.emulsifierConfig)
      }
    }

    const collisions = detectAndResolveCollisions(grid, particles)

    // Process reactions (skip for solubility — no chemical reactions)
    if (!rxn.hasPolarityForces) {
    const activationEnergy = rxn.activationEnergy || 0.4
    const catalystReduction = (vars.catalyst && rxn.catalystReduction) ? rxn.catalystReduction : 0
    const threshold = activationEnergy * (1 - catalystReduction) * targetSpeed * targetSpeed * 0.5

    // For reversible reactions (Haber)
    const eqModifier = rxn.equilibriumModifier ? rxn.equilibriumModifier(vars) : 1

    // Random gate: use reduced gate for heterogeneous reactions without catalyst
    const randomGate = (rxn.hasCatalystSurface && !vars.catalyst)
      ? (rxn.homogeneousGate || 0.02)
      : 0.3

    // Skip homogeneous collision reactions if catalyst surface is active
    // (surface mechanism handles reactions instead)
    const skipHomogeneous = rxn.hasCatalystSurface && vars.catalyst

    if (!skipHomogeneous) {
      for (const col of collisions) {
        const { particleA, particleB, energy } = col
        if (!particleA.alive || !particleB.alive) continue
        if (particleA.bound || particleB.bound) continue
        // Skip reactions involving denatured enzymes
        if (particleA.denatured || particleB.denatured) continue

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
          if (Math.random() > randomGate) continue

          // React!
          const midX = (particleA.x + particleB.x) / 2
          const midY = (particleA.y + particleB.y) / 2

          // Consume extra nearby reactants if stoichiometry requires more than 2
          let extraOk = true
          const extraConsumed = []
          if (rule.extraConsume && rule.extraConsume.length > 0) {
            for (const extraType of rule.extraConsume) {
              const nearby = particles.find(p =>
                p.alive && !p.bound && p !== particleA && p !== particleB &&
                !extraConsumed.includes(p) &&
                p.type === extraType &&
                p.distanceTo(particleA) < 80
              )
              if (nearby) {
                extraConsumed.push(nearby)
              } else {
                extraOk = false
                break
              }
            }
          }
          if (!extraOk) continue

          // Remove reactants (unless preserved as catalyst)
          if (rule.preserveCatalyst) {
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
          for (const ep of extraConsumed) {
            ep.alive = false
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
    }

    // Surface catalyst reactions (Haber process)
    if (catalyst?.active) {
      // Forward: 1 N2 + 3 H2 on surface → 2 NH3
      const forwardRxn = catalyst.checkForwardReaction(eqModifier)
      if (forwardRxn) {
        // Kill reactants
        forwardRxn.n2.alive = false
        catalyst.unbind(forwardRxn.n2)
        for (const h of forwardRxn.h2s) {
          h.alive = false
          catalyst.unbind(h)
        }

        // Spawn 2 NH3 launching upward from the surface
        const nh3Type = rxn.particleTypes.find(pt => pt.type === 'NH3')
        if (nh3Type) {
          for (let i = 0; i < 2; i++) {
            const p = new Particle({
              type: nh3Type.type,
              x: forwardRxn.n2.x + (i - 0.5) * 30,
              y: catalyst.y - nh3Type.radius - 5,
              radius: nh3Type.radius || 12,
              color: nh3Type.color,
              label: nh3Type.label,
              mass: nh3Type.mass || 1,
            })
            p.shape = nh3Type.shape || 'circle'
            p.vx = (Math.random() - 0.5) * targetSpeed * 0.4
            p.vy = -targetSpeed * (0.6 + Math.random() * 0.4)  // Launch upward
            p.reacting = true
            p.reactTimer = 0.6  // Cooldown — can't re-bind until clear of surface
            particles.push(p)
          }
        }
        statsRef.current.reactionCount++
      }

      // Reverse: 2 NH3 on surface → 1 N2 + 3 H2
      const reverseRxn = catalyst.checkReverseReaction(eqModifier)
      if (reverseRxn) {
        for (const nh3 of reverseRxn.nh3s) {
          nh3.alive = false
          catalyst.unbind(nh3)
        }

        const midX = (reverseRxn.nh3s[0].x + reverseRxn.nh3s[1].x) / 2

        // Spawn 1 N2
        const n2Type = rxn.particleTypes.find(pt => pt.type === 'N2')
        if (n2Type) {
          const p = new Particle({
            type: n2Type.type,
            x: midX,
            y: catalyst.y - n2Type.radius - 5,
            radius: n2Type.radius || 12,
            color: n2Type.color,
            label: n2Type.label,
            mass: n2Type.mass || 1,
          })
          p.shape = n2Type.shape || 'circle'
          p.vx = (Math.random() - 0.5) * targetSpeed * 0.4
          p.vy = -targetSpeed * (0.6 + Math.random() * 0.4)
          p.reacting = true
          p.reactTimer = 0.6  // Cooldown — can't re-bind until clear of surface
          particles.push(p)
        }

        // Spawn 3 H2
        const h2Type = rxn.particleTypes.find(pt => pt.type === 'H2')
        if (h2Type) {
          for (let i = 0; i < 3; i++) {
            const p = new Particle({
              type: h2Type.type,
              x: midX + (i - 1) * 20,
              y: catalyst.y - h2Type.radius - 5,
              radius: h2Type.radius || 12,
              color: h2Type.color,
              label: h2Type.label,
              mass: h2Type.mass || 1,
            })
            p.shape = h2Type.shape || 'circle'
            p.vx = (Math.random() - 0.5) * targetSpeed * 0.5
            p.vy = -targetSpeed * (0.5 + Math.random() * 0.5)
            p.reacting = true
            p.reactTimer = 0.6  // Cooldown — can't re-bind until clear of surface
            particles.push(p)
          }
        }
        statsRef.current.reactionCount++
      }

      // Clean dead particles from catalyst bound list
      catalyst.cleanDead()
    }
    } // end if (!rxn.hasPolarityForces)

    // Clean dead particles
    particlesRef.current = particles.filter(p => p.alive)

    // Update elapsed
    statsRef.current.elapsed = elapsed

    // Calculate reaction rate (reactions per second over last 2 seconds)
    const now = elapsed
    const prevCount = statsRef.current._prevReactionCount || 0
    const newReactions = statsRef.current.reactionCount - prevCount
    statsRef.current._prevReactionCount = statsRef.current.reactionCount
    if (newReactions > 0) {
      statsRef.current.rateWindow.push({ time: now, count: newReactions })
    }
    statsRef.current.rateWindow = statsRef.current.rateWindow.filter(w => now - w.time < 2)
    const totalInWindow = statsRef.current.rateWindow.reduce((sum, w) => sum + w.count, 0)
    statsRef.current.reactionRate = totalInWindow / 2

    // Update graph data periodically
    if (elapsed - lastGraphUpdateRef.current >= GRAPH_CONFIG.updateIntervalMs / 1000) {
      lastGraphUpdateRef.current = elapsed

      const point = { time: Math.round(elapsed * 10) / 10 }

      if (rxn.hasPolarityForces) {
        // Solubility graph: track dissolution or separation percentage
        if (rxn.immiscible) {
          const soluteType = rxn.soluteTypes?.[0]
          const solventType = rxn.solventTypes?.[0]
          const sepPct = soluteType && solventType
            ? calcSeparationPercent(particlesRef.current, soluteType, solventType)
            : 0
          point.separated = sepPct
          setDissolutionStats({ separationPercent: sepPct })
        } else {
          // Lattice scenarios (e.g. NaCl): % dissolved = % of ions released from the bound crystal
          // Cluster scenarios (sugar, nail polish): % dissolved = how dispersed solute is from cluster center
          const disPct = rxn.latticeConfig?.bound
            ? calcLatticeDissolutionPercent(particlesRef.current, rxn.soluteTypes || [])
            : clusterCenterRef.current
              ? calcDissolutionPercent(particlesRef.current, rxn.soluteTypes || [], clusterCenterRef.current, width)
              : 0
          point.dissolved = disPct
          setDissolutionStats({ dissolutionPercent: disPct })
        }
      } else {
        // Rates-of-reaction graph: track particle counts
        const alive = particlesRef.current.filter(p => p.alive)
        const total = Math.max(1, alive.length)
        const counts = {}
        for (const p of alive) {
          counts[p.type] = (counts[p.type] || 0) + 1
        }
        for (const line of rxn.graph.lines) {
          point[line.key] = ((counts[line.key] || 0) / total * 100)
        }
      }

      graphDataRef.current = [...graphDataRef.current.slice(-GRAPH_CONFIG.maxDataPoints), point]
      setGraphData([...graphDataRef.current])
    }

    // Check for all reactants consumed
    const hasReactants = particlesRef.current.some(p => p.alive && reactantTypesRef.current.includes(p.type))
    if (!hasReactants && particlesRef.current.length > 0 && !rxn.reversible) {
      setAllConsumed(true)
    }

    // Update annotation
    const annotation = getActiveAnnotation(rxn, vars, allConsumed, allDenatured, dissolutionStats)
    setActiveAnnotation(annotation)

    // Periodic stats update to React state
    setStats({
      reactionCount: statsRef.current.reactionCount,
      reactionRate: Math.round(statsRef.current.reactionRate * 10) / 10,
      elapsed: Math.round(elapsed * 10) / 10,
    })
  }, [canvasRef, allConsumed, allDenatured, dissolutionStats])

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
    renderFrame(ctx, logicalW, logicalH, particlesRef.current, annotations, '#1a1d24', catalystRef.current)
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
    enzymeStats,
    dissolutionStats,
    initSimulation,
    update,
    draw,
    getParticleCount,
    particlesRef,
  }
}

function createParticle(pType, x, y) {
  const p = new Particle({
    type: pType.type,
    x,
    y,
    radius: pType.radius || 12,
    color: pType.color,
    label: pType.label,
    mass: pType.mass || 1,
  })
  p.shape = pType.shape || 'circle'
  p.polarity = pType.polarity || 0
  p.buoyancy = pType.buoyancy || 0
  p.charge = pType.charge || 0   // formal ionic charge (+1 / -1 / 0)
  return p
}

function getDefaultVariables(reaction) {
  if (!reaction) return { temperature: 25, concentration: 0.5, catalyst: false }
  const vars = {}
  for (const v of reaction.variables) {
    vars[v.id] = v.default
  }
  return vars
}

function getActiveAnnotation(reaction, vars, allConsumed, allDenatured, dissolutionStats) {
  if (!reaction?.annotations) return null

  for (const ann of reaction.annotations) {
    if (ann.condition === 'allConsumed' && allConsumed) return ann.text
    if (ann.condition === 'allDenatured' && allDenatured) return ann.text
    if (ann.condition === 'always') continue
    if (typeof ann.condition === 'function' && ann.condition(vars, dissolutionStats)) return ann.text
  }

  // Default annotation
  const defaultAnn = reaction.annotations.find(a => a.condition === 'always')
  return defaultAnn?.text || null
}
