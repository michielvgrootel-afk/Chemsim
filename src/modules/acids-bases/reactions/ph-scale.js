// pH Scale Sandbox — students drive the pH up/down with four buttons
// that inject strong/weak acids/bases. A universal indicator everywhere
// repaints across all 5 colour bands to show the resulting pH.

const INDICATOR_THRESHOLDS = [
  { minPH: 11, color: '#4f9cf0', label: 'B' }, // strong base — blue
  { minPH: 8,  color: '#9b6ef0', label: 'B' }, // weak base — purple
  { minPH: 6,  color: '#3dba7e', label: 'N' }, // neutral — green
  { minPH: 3,  color: '#f0913a', label: 'A' }, // weak acid — orange
  { minPH: 0,  color: '#e05555', label: 'A' }, // strong acid — red
]

export const phScaleScenario = {
  id: 'ph-scale',
  name: 'pH Scale Sandbox',
  subtitle: 'Drive pH up & down with acids & bases',
  description: 'Click the buttons to add strong or weak acids and bases. Watch the universal indicator repaint and the pH counter respond. Goal: try to make the indicator turn each colour from red (pH 1) to blue (pH 14).',

  guidingQuestion: 'What does the pH scale actually represent at the molecular level — and what does it take to swing the pH from one extreme to the other?',
  assignmentGoal: 'Make the indicator turn each colour: red, orange, green, purple, and blue. Note how many drops of each substance it takes to swing the pH a full unit.',

  particleTypes: [
    { type: 'H2O',     label: 'H₂O',   color: '#8ab4f0', shape: 'diamond',  radius: 7,  mass: 0.8, polarity: 0.85, charge:  0 },
    { type: 'HCl',     label: 'HCl',   color: '#e05555', shape: 'circle',   radius: 12, mass: 1.2, polarity: 0.4,  charge:  0 },
    { type: 'NaOH',    label: 'NaOH',  color: '#4f9cf0', shape: 'square',   radius: 14, mass: 1.4, polarity: 0.5,  charge:  0 },
    { type: 'CH3COOH', label: 'HAc',   color: '#c46b8a', shape: 'hexagon',  radius: 14, mass: 1.4, polarity: 0.3,  charge:  0 },
    { type: 'NH3',     label: 'NH₃',   color: '#3dba7e', shape: 'triangle', radius: 12, mass: 0.9, polarity: 0.3,  charge:  0 },
    { type: 'H',       label: 'H⁺',    color: '#f0913a', shape: 'circle',   radius: 8,  mass: 0.3, polarity: 0,    charge: +1 },
    { type: 'OH',      label: 'OH⁻',   color: '#56c0e0', shape: 'circle',   radius: 11, mass: 0.6, polarity: 0,    charge: -1 },
    { type: 'Cl',      label: 'Cl⁻',   color: '#3dba7e', shape: 'circle',   radius: 14, mass: 1.3, polarity: 0,    charge: -1 },
    { type: 'Na',      label: 'Na⁺',   color: '#4f9cf0', shape: 'circle',   radius: 12, mass: 1.1, polarity: 0,    charge: +1 },
    { type: 'CH3COO',  label: 'Ac⁻',   color: '#9b6ef0', shape: 'hexagon',  radius: 13, mass: 1.3, polarity: 0,    charge: -1 },
    { type: 'NH4',     label: 'NH₄⁺',  color: '#f0c040', shape: 'triangle', radius: 13, mass: 1.0, polarity: 0,    charge: +1 },
    // Universal indicator particle — colour is reassigned at runtime
    // based on the global pH (see indicatorConfig.thresholds).
    { type: 'IND',     label: 'I',     color: '#3dba7e', shape: 'star',     radius: 10, mass: 0.5, polarity: 0,    charge:  0 },
  ],

  variables: [
    {
      id: 'temperature',
      label: 'Temperature',
      unit: '°C',
      min: 0, max: 100, step: 1, default: 25,
      icon: 'thermometer',
      tooltip: 'Temperature affects collision rate but not pH at equilibrium.',
    },
    {
      id: 'addHCl',
      label: 'Add HCl drop (strong acid)',
      type: 'button',
      icon: 'droplet',
      spawn: { type: 'HCl', count: 5, region: 'top', spread: 100 },
      cooldownMs: 400,
      tooltip: 'Drops 5 HCl molecules. Strong acid: each one fully ionises into H⁺ + Cl⁻, swinging the pH down quickly.',
    },
    {
      id: 'addNaOH',
      label: 'Add NaOH drop (strong base)',
      type: 'button',
      icon: 'droplet',
      spawn: { type: 'NaOH', count: 5, region: 'top', spread: 100 },
      cooldownMs: 400,
      tooltip: 'Drops 5 NaOH molecules. Strong base: each one fully ionises into Na⁺ + OH⁻, swinging the pH up quickly.',
    },
    {
      id: 'addHAc',
      label: 'Add CH₃COOH (weak acid)',
      type: 'button',
      icon: 'droplet',
      spawn: { type: 'CH3COOH', count: 8, region: 'top', spread: 100 },
      cooldownMs: 400,
      tooltip: 'Drops 8 acetic acid molecules. Weak acid: only ~5 % ionise, so the pH swing is much smaller than the same number of HCl drops.',
    },
    {
      id: 'addNH3',
      label: 'Add NH₃ (weak base)',
      type: 'button',
      icon: 'droplet',
      spawn: { type: 'NH3', count: 8, region: 'top', spread: 100 },
      cooldownMs: 400,
      tooltip: 'Drops 8 ammonia molecules. Weak base: only ~5 % ionise, so the pH swing is much smaller than the same number of NaOH drops.',
    },
  ],

  // Initial population: pure water + indicators (neutral starting state)
  totalParticles: 100,
  maxParticleCount: 140,
  initialRatio: { H2O: 0.92, IND: 0.08 },

  speedFromTemp: (temp) => 0.4 + (temp / 100) * 1.2,
  randomGate: 0.5,

  // Reaction rules — order matters (first-match-wins). Most-specific
  // reactions (neutralisation, buffer absorption) first, then dissociations.
  reactions: [
    // 1. Neutralisation — must fire before either ion gets re-consumed
    { reactants: ['H', 'OH'], products: ['H2O', 'H2O'] },

    // 2. Strong-acid / strong-base dissociation (water is the catalyst-dummy)
    { reactants: ['HCl', 'H2O'],  products: ['H', 'Cl'],  preserveCatalyst: true, catalystType: 'H2O' },
    { reactants: ['NaOH', 'H2O'], products: ['Na', 'OH'], preserveCatalyst: true, catalystType: 'H2O' },

    // 3. Weak-acid / weak-base dissociation (forward, gentle)
    { reactants: ['CH3COOH', 'H2O'], products: ['H', 'CH3COO'], preserveCatalyst: true, catalystType: 'H2O' },
    { reactants: ['NH3', 'H2O'],     products: ['NH4', 'OH'],   preserveCatalyst: true, catalystType: 'H2O' },

    // 4. Weak-acid / weak-base re-association (reverse, strongly favoured)
    { reactants: ['H', 'CH3COO'], products: ['CH3COOH', 'H2O'], isReverse: true },
    { reactants: ['NH4', 'OH'],   products: ['NH3', 'H2O'],     isReverse: true },
  ],

  // Low activation energy because most collisions in this simulation
  // should react (this is dissolution chemistry, not high-temperature
  // chemistry). The randomGate above gives the chaos.
  activationEnergy: 0.04,
  // Weak acids/bases settle at ~5 % dissociation — the reverse-rule
  // threshold is multiplied by 1/eqModifier, so a small value here means
  // re-association dominates.
  equilibriumModifier: () => 0.05,

  // pH counter + indicator configuration
  phConfig: { neutralPH: 7, scale: 2.5 },
  indicatorConfig: {
    type: 'IND',
    thresholds: INDICATOR_THRESHOLDS,
  },

  graph: {
    lines: [
      { key: 'pH', label: 'pH', color: '#9b6ef0' },
    ],
    xLabel: 'Time (s)',
    yLabel: 'pH',
  },

  annotations: [
    {
      id: 'default',
      text: 'Click the buttons to add acid or base. Watch how the indicator particles change colour together — and how much faster strong acids/bases swing the pH than weak ones.',
      condition: 'always',
    },
    {
      id: 'acidic',
      text: 'Acidic territory — H⁺ ions outnumber OH⁻. Each strong acid molecule fully dissociates; each weak acid only partially. Try adding base to swing back the other way.',
      condition: (vars, stats) => stats?.ph != null && stats.ph < 5,
    },
    {
      id: 'basic',
      text: 'Basic territory — OH⁻ ions outnumber H⁺. The indicator goes purple/blue. To neutralise, add an acid: H⁺ + OH⁻ → H₂O.',
      condition: (vars, stats) => stats?.ph != null && stats.ph > 9,
    },
    {
      id: 'neutral',
      text: 'Near-neutral. In pure water there are equal tiny amounts of H⁺ and OH⁻ — water itself is in equilibrium with its ions.',
      condition: (vars, stats) => stats?.ph != null && stats.ph >= 5 && stats.ph <= 9,
    },
  ],
}
