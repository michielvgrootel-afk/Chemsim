// Oil in Water — IMMISCIBLE (does NOT dissolve)
// Nonpolar oil and polar water repel, oil floats to top

export const oilWaterScenario = {
  id: 'oil-water',
  name: 'Oil in Water',
  subtitle: 'Oil does NOT dissolve in H\u2082O',
  description: 'Oil is nonpolar, water is polar. Watch what happens when you try to mix them \u2014 "like dissolves like" means polar and nonpolar don\u2019t mix!',

  guidingQuestion: 'Why does oil float on water and refuse to mix, no matter how hard you stir?',
  assignmentGoal: 'Observe how oil and water separate into layers. Try stirring \u2014 does it help? Compare this to the scenarios where substances DO dissolve.',

  particleTypes: [
    { type: 'OIL', label: 'Oil', color: '#f0913a', shape: 'hexagon', radius: 14, mass: 0.9, polarity: -0.8, buoyancy: 0.15 },
    { type: 'H2O', label: 'H\u2082O', color: '#8ab4f0', shape: 'diamond', radius: 10, mass: 1.0, polarity: 0.85, buoyancy: -0.05 },
    // Emulsifier (soap) \u2014 amphipathic molecule. Polarity 0 because the
    // molecule is neither uniformly polar nor nonpolar; the binding system
    // handles its dual character explicitly (head bonds water, tail bonds oil).
    { type: 'EMUL', label: '', color: '#5fa8f0', shape: 'emulsifier', radius: 13, mass: 1.0, polarity: 0, buoyancy: 0 },
  ],

  variables: [
    {
      id: 'temperature',
      label: 'Temperature',
      unit: '\u00b0C',
      min: 0, max: 100, step: 1, default: 25,
      icon: 'thermometer',
      tooltip: 'Temperature doesn\u2019t change whether oil dissolves \u2014 it only speeds up separation.',
    },
    {
      id: 'stirring',
      label: 'Stirring',
      type: 'toggle',
      default: false,
      icon: 'zap',
      tooltip: 'Stirring temporarily mixes oil and water, but they always separate again.',
    },
    {
      id: 'emulsifier',
      label: 'Emulsifier (soap)',
      type: 'toggle',
      default: false,
      icon: 'flask',
      tooltip: 'Adds amphipathic emulsifier molecules. The polar head bonds water, the nonpolar tail bonds oil \u2014 keeping them mixed even after stirring stops.',
    },
  ],

  // Emulsifier configuration \u2014 used by the engine when the toggle is on
  emulsifierConfig: {
    count: 14,         // how many emulsifier particles to spawn
    bondRange: 60,     // px \u2014 search radius for finding oil/water to bind
    bondDistance: 26,  // px \u2014 ideal distance from emulsifier to its partner
    springK: 6,        // spring constant for the bond force
    maxOilPerEmul: 2,  // up to 2 oil partners per emulsifier
    maxWaterPerEmul: 2, // up to 2 water partners per emulsifier
  },

  hasPolarityForces: true,
  soluteTypes: ['OIL'],
  solventTypes: ['H2O'],
  immiscible: true,  // Tracks separation instead of dissolution

  spawnMode: 'mixed',  // Start randomly mixed to show separation

  // Denser particle field so the separation into layers reads clearly.
  // 130 total ≈ 4× the original count — populated enough to read the layered
  // separation at a glance. Oil-water uses full all-pairs polarity forces, but
  // the spatial grid keeps the per-frame cost manageable at this size.
  totalParticles: 130,
  maxParticleCount: 160,   // sets the upper bound of the per-type sliders
  initialRatio: { OIL: 0.3, H2O: 0.7 },

  speedFromTemp: (temp) => 0.3 + (temp / 100) * 2.0,

  reactions: [],

  graph: {
    lines: [
      { key: 'separated', label: '% Separated', color: '#f0913a' },
    ],
    xLabel: 'Time (s)',
    yLabel: '% Separated',
  },

  annotations: [
    {
      id: 'default',
      text: 'Oil is nonpolar (long hydrocarbon chains). Water is polar (strong hydrogen bonds). These are fundamentally incompatible \u2014 watch them separate!',
      condition: 'always',
    },
    {
      id: 'separating',
      text: 'The oil is clustering and floating upward! Water molecules prefer to hydrogen-bond with each other rather than interact with nonpolar oil. This is the hydrophobic effect.',
      condition: (vars, stats) => stats?.separationPercent > 20 && stats?.separationPercent < 80 && !vars.stirring,
    },
    {
      id: 'separated',
      text: 'Fully separated into layers! Oil floats on top because it\u2019s less dense. No amount of shaking changes their fundamental incompatibility \u2014 polar and nonpolar don\u2019t mix.',
      condition: (vars, stats) => stats?.separationPercent >= 80 && !vars.stirring,
    },
    {
      id: 'stirring-active',
      text: 'Stirring temporarily mixes them into an emulsion \u2014 but watch what happens when you stop! Without an emulsifier (like soap), they always separate again.',
      condition: (vars) => vars.stirring && !vars.emulsifier,
    },
    {
      id: 'emulsifier-active',
      text: 'The emulsifier molecules have a polar head (water-loving) and a nonpolar tail (oil-loving). Each one bridges oil droplets to water \u2014 the mixture stays mixed even after stirring stops. This is how soap cleans grease!',
      condition: (vars) => vars.emulsifier,
    },
    {
      id: 'cold',
      text: 'Cold oil is even more viscous and separates more slowly \u2014 but it still won\u2019t dissolve. Temperature changes the speed of separation, not whether they mix.',
      condition: (vars) => vars.temperature <= 10,
    },
  ],
}
