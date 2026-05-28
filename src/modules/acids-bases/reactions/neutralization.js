// Neutralisation with universal indicator
// Beaker of HCl + indicator + water. The "Add NaOH drop" button
// titrates base into the beaker — students watch H+ + OH- → H2O,
// indicators shift through 5 colour bands, pH climbs.

const INDICATOR_THRESHOLDS = [
  { minPH: 11, color: '#4f9cf0', label: 'B' },
  { minPH: 8,  color: '#9b6ef0', label: 'B' },
  { minPH: 6,  color: '#3dba7e', label: 'N' },
  { minPH: 3,  color: '#f0913a', label: 'A' },
  { minPH: 0,  color: '#e05555', label: 'A' },
]

export const neutralizationScenario = {
  id: 'neutralization',
  name: 'Neutralisation',
  subtitle: 'HCl + NaOH → titration to neutral',
  description: 'Start with hydrochloric acid in the beaker (red indicator means acidic). Click "Add NaOH drop" repeatedly to titrate. Each drop falls from the top, ionises into Na⁺ + OH⁻, and the OH⁻ reacts with H⁺ to form water. Watch the indicator shift colour and the pH climb.',

  guidingQuestion: 'What is actually happening when an acid is neutralised by a base — and at what point exactly does the indicator change colour?',
  assignmentGoal: 'Add NaOH drops one at a time. Note how many drops it takes to swing the indicator from red to green (neutral), and how many more to reach blue (basic). The point where colour shifts is the equivalence point.',

  particleTypes: [
    { type: 'H2O',  label: 'H₂O',  color: '#8ab4f0', shape: 'diamond', radius: 7,  mass: 0.8, polarity: 0.85, charge:  0 },
    { type: 'HCl',  label: 'HCl',  color: '#e05555', shape: 'circle',  radius: 12, mass: 1.2, polarity: 0.4,  charge:  0 },
    { type: 'NaOH', label: 'NaOH', color: '#4f9cf0', shape: 'square',  radius: 14, mass: 1.4, polarity: 0.5,  charge:  0 },
    { type: 'H',    label: 'H⁺',   color: '#f0913a', shape: 'circle',  radius: 8,  mass: 0.3, polarity: 0,    charge: +1 },
    { type: 'OH',   label: 'OH⁻',  color: '#56c0e0', shape: 'circle',  radius: 11, mass: 0.6, polarity: 0,    charge: -1 },
    { type: 'Cl',   label: 'Cl⁻',  color: '#3dba7e', shape: 'circle',  radius: 14, mass: 1.3, polarity: 0,    charge: -1 },
    { type: 'Na',   label: 'Na⁺',  color: '#4f9cf0', shape: 'circle',  radius: 12, mass: 1.1, polarity: 0,    charge: +1 },
    { type: 'IND',  label: 'I',    color: '#e05555', shape: 'star',    radius: 10, mass: 0.5, polarity: 0,    charge:  0 },
  ],

  variables: [
    {
      id: 'temperature',
      label: 'Temperature',
      unit: '°C',
      min: 0, max: 100, step: 1, default: 25,
      icon: 'thermometer',
      tooltip: 'Higher temperature speeds up neutralisation but doesn’t change the equivalence point.',
    },
    {
      id: 'addBase',
      label: 'Add NaOH drop',
      type: 'button',
      icon: 'droplet',
      spawn: { type: 'NaOH', count: 6, region: 'top', spread: 80 },
      cooldownMs: 400,
      tooltip: 'Drops 6 NaOH molecules at the top of the beaker. They fall, ionise into Na⁺ + OH⁻, and the OH⁻ reacts with H⁺ → H₂O.',
    },
    {
      id: 'addAcid',
      label: 'Add HCl drop',
      type: 'button',
      icon: 'droplet',
      spawn: { type: 'HCl', count: 6, region: 'top', spread: 80 },
      cooldownMs: 400,
      tooltip: 'Drops 6 HCl molecules — useful for over-shooting practice. Each ionises into H⁺ + Cl⁻.',
    },
  ],

  totalParticles: 90,
  maxParticleCount: 120,
  initialRatio: { HCl: 0.20, IND: 0.07, H2O: 0.73 },

  speedFromTemp: (temp) => 0.4 + (temp / 100) * 1.2,
  randomGate: 0.55,

  reactions: [
    // 1. Neutralisation FIRST so it always wins on an H/OH collision
    { reactants: ['H', 'OH'], products: ['H2O', 'H2O'] },
    // 2. Strong-acid/strong-base dissociation
    { reactants: ['HCl', 'H2O'],  products: ['H', 'Cl'],  preserveCatalyst: true, catalystType: 'H2O' },
    { reactants: ['NaOH', 'H2O'], products: ['Na', 'OH'], preserveCatalyst: true, catalystType: 'H2O' },
  ],

  activationEnergy: 0.04,

  phConfig: { neutralPH: 7, scale: 2.5 },
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
      text: 'You’re starting with HCl in water — the indicator is red because there are lots of H⁺ ions. Click "Add NaOH drop" to begin titrating.',
      condition: 'always',
    },
    {
      id: 'approaching',
      text: 'Getting close to neutral! Each new OH⁻ ion is reacting almost immediately with H⁺ → H₂O. The indicator is transitioning through the band colours.',
      condition: (vars, stats) => stats?.ph != null && stats.ph >= 5 && stats.ph < 8,
    },
    {
      id: 'overshot',
      text: 'You’ve added too much base — the solution is now alkaline. Add HCl drops to bring it back, or note how easy it is to overshoot a titration!',
      condition: (vars, stats) => stats?.ph != null && stats.ph >= 10,
    },
    {
      id: 'still-acidic',
      text: 'Still acidic. Keep dropping NaOH — each Na⁺ acts as a spectator ion (it stays in solution), while OH⁻ reacts with H⁺.',
      condition: (vars, stats) => stats?.ph != null && stats.ph < 4,
    },
  ],
}
