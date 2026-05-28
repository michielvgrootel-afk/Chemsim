// Buffer Demonstration
// Pre-mixed CH3COOH + CH3COO- (acetate buffer at pH ≈ 4.75).
// Adding HCl drops: H+ + CH3COO- → CH3COOH (buffer absorbs the acid).
// Adding NaOH drops: OH- + CH3COOH → CH3COO- + H2O (buffer absorbs the base).
// pH barely moves — that's the magic of a buffer.

const INDICATOR_THRESHOLDS = [
  { minPH: 11, color: '#4f9cf0', label: 'B' },
  { minPH: 8,  color: '#9b6ef0', label: 'B' },
  { minPH: 6,  color: '#3dba7e', label: 'N' },
  { minPH: 3,  color: '#f0913a', label: 'A' },
  { minPH: 0,  color: '#e05555', label: 'A' },
]

export const bufferScenario = {
  id: 'buffer',
  name: 'Buffer Demonstration',
  subtitle: 'Acetate buffer resists pH change',
  description: 'A buffer is an equimolar mixture of a weak acid (CH₃COOH) and its conjugate base (CH₃COO⁻). Add strong acid or base — the buffer absorbs them, and the pH barely changes. Compare to the Neutralisation scenario, where the same drops swing the pH dramatically.',

  guidingQuestion: 'Why does adding HCl to a buffer barely change the pH, but adding the same HCl to water swings the pH from neutral to strongly acidic?',
  assignmentGoal: 'Click "Add HCl drop" five times. Note how much the pH moves. Then switch to the Neutralisation scenario and do the same — the contrast is the lesson.',

  particleTypes: [
    { type: 'H2O',     label: 'H₂O', color: '#8ab4f0', shape: 'diamond', radius: 7,  mass: 0.8, polarity: 0.85, charge:  0 },
    { type: 'CH3COOH', label: 'HAc', color: '#c46b8a', shape: 'hexagon', radius: 14, mass: 1.4, polarity: 0.3,  charge:  0 },
    { type: 'CH3COO',  label: 'Ac⁻', color: '#9b6ef0', shape: 'hexagon', radius: 13, mass: 1.3, polarity: 0,    charge: -1 },
    { type: 'HCl',     label: 'HCl', color: '#e05555', shape: 'circle',  radius: 12, mass: 1.2, polarity: 0.4,  charge:  0 },
    { type: 'NaOH',    label: 'NaOH',color: '#4f9cf0', shape: 'square',  radius: 14, mass: 1.4, polarity: 0.5,  charge:  0 },
    { type: 'H',       label: 'H⁺',  color: '#f0913a', shape: 'circle',  radius: 8,  mass: 0.3, polarity: 0,    charge: +1 },
    { type: 'OH',      label: 'OH⁻', color: '#56c0e0', shape: 'circle',  radius: 11, mass: 0.6, polarity: 0,    charge: -1 },
    { type: 'Cl',      label: 'Cl⁻', color: '#3dba7e', shape: 'circle',  radius: 14, mass: 1.3, polarity: 0,    charge: -1 },
    { type: 'Na',      label: 'Na⁺', color: '#4f9cf0', shape: 'circle',  radius: 12, mass: 1.1, polarity: 0,    charge: +1 },
    { type: 'IND',     label: 'I',   color: '#f0913a', shape: 'star',    radius: 10, mass: 0.5, polarity: 0,    charge:  0 },
  ],

  variables: [
    {
      id: 'temperature',
      label: 'Temperature',
      unit: '°C',
      min: 0, max: 100, step: 1, default: 25,
      icon: 'thermometer',
      tooltip: 'Buffer capacity is largely independent of temperature.',
    },
    {
      id: 'addAcid',
      label: 'Add HCl drop',
      type: 'button',
      icon: 'droplet',
      spawn: { type: 'HCl', count: 5, region: 'top', spread: 80 },
      cooldownMs: 400,
      tooltip: 'Drops 5 HCl molecules. Their H⁺ ions get gobbled up by CH₃COO⁻ → CH₃COOH, so the pH barely budges.',
    },
    {
      id: 'addBase',
      label: 'Add NaOH drop',
      type: 'button',
      icon: 'droplet',
      spawn: { type: 'NaOH', count: 5, region: 'top', spread: 80 },
      cooldownMs: 400,
      tooltip: 'Drops 5 NaOH molecules. Their OH⁻ ions get neutralised by CH₃COOH → CH₃COO⁻ + H₂O, so the pH barely budges.',
    },
  ],

  totalParticles: 90,
  maxParticleCount: 130,
  // Equimolar weak acid + conjugate base + spectator Na+ + water
  initialRatio: { CH3COOH: 0.28, CH3COO: 0.28, Na: 0.07, H2O: 0.37 },

  speedFromTemp: (temp) => 0.4 + (temp / 100) * 1.2,
  randomGate: 0.55,

  reactions: [
    // Order matters — most specific first.
    // 1. Neutralisation always wins on an H+/OH- collision
    { reactants: ['H', 'OH'], products: ['H2O', 'H2O'] },
    // 2. Buffer absorption rules — the conjugate pair soaks up additions
    { reactants: ['H', 'CH3COO'],     products: ['CH3COOH', 'H2O'] },         // added H+ + Ac- → HAc
    { reactants: ['OH', 'CH3COOH'],   products: ['CH3COO', 'H2O'] },          // added OH- + HAc → Ac-
    // 3. Strong acid/base dissociation
    { reactants: ['HCl', 'H2O'],  products: ['H', 'Cl'],  preserveCatalyst: true, catalystType: 'H2O' },
    { reactants: ['NaOH', 'H2O'], products: ['Na', 'OH'], preserveCatalyst: true, catalystType: 'H2O' },
    // 4. Weak-acid baseline equilibrium (keeps the buffer at its set point)
    { reactants: ['CH3COOH', 'H2O'], products: ['H', 'CH3COO'], preserveCatalyst: true, catalystType: 'H2O' },
    { reactants: ['H', 'CH3COO'],    products: ['CH3COOH', 'H2O'], isReverse: true },
  ],

  activationEnergy: 0.04,
  equilibriumModifier: () => 0.05,

  phConfig: { neutralPH: 7, scale: 2.0 },
  indicatorConfig: { type: 'IND', thresholds: INDICATOR_THRESHOLDS },

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
      text: 'This beaker contains a buffer: equal amounts of CH₃COOH (weak acid) and CH₃COO⁻ (its conjugate base). Add acid or base and watch the pH meter — it should barely move!',
      condition: 'always',
    },
    {
      id: 'still-buffered',
      text: 'pH still in the buffer\'s comfort zone. The conjugate pair is absorbing the added H⁺ or OH⁻ — each one is consumed immediately by reacting with its conjugate partner.',
      condition: (vars, stats) => stats?.ph != null && stats.ph >= 3.5 && stats.ph <= 6.5,
    },
    {
      id: 'capacity-exceeded',
      text: 'You\'ve overwhelmed the buffer — too many drops, not enough conjugate partners left to absorb them. Beyond its capacity, a buffer fails. This is why blood (a real buffer) only works within a narrow range.',
      condition: (vars, stats) => stats?.ph != null && (stats.ph < 3 || stats.ph > 8),
    },
  ],
}
