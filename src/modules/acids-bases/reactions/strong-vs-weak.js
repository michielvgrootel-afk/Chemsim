// Strong vs Weak Acid Dissociation
// Beaker contains both HCl and CH3COOH in water side-by-side.
// HCl fully dissociates (~100 %); CH3COOH only ~5 % at equilibrium.
// Students see the same starting amount of acid → vastly different [H+].

export const strongVsWeakScenario = {
  id: 'strong-vs-weak',
  name: 'Strong vs Weak Acid',
  subtitle: 'HCl vs CH₃COOH dissociation',
  description: 'A beaker containing the same number of HCl molecules and CH₃COOH (acetic acid) molecules dissolved in water. Watch how HCl ionises completely, while CH₃COOH barely ionises — that\'s the difference between a strong and a weak acid.',

  guidingQuestion: 'Both acids contain hydrogen — why does HCl produce so many more H⁺ ions than CH₃COOH at the same concentration?',
  assignmentGoal: 'Observe what fraction of each acid actually dissociates. Compare the H⁺ count from each. Why does this matter for pH?',

  particleTypes: [
    { type: 'H2O',     label: 'H₂O', color: '#8ab4f0', shape: 'diamond', radius: 7,  mass: 0.8, polarity: 0.85, charge:  0 },
    { type: 'HCl',     label: 'HCl', color: '#e05555', shape: 'circle',  radius: 12, mass: 1.2, polarity: 0.4,  charge:  0 },
    { type: 'CH3COOH', label: 'HAc', color: '#c46b8a', shape: 'hexagon', radius: 14, mass: 1.4, polarity: 0.3,  charge:  0 },
    { type: 'H',       label: 'H⁺',  color: '#f0913a', shape: 'circle',  radius: 8,  mass: 0.3, polarity: 0,    charge: +1 },
    { type: 'Cl',      label: 'Cl⁻', color: '#3dba7e', shape: 'circle',  radius: 14, mass: 1.3, polarity: 0,    charge: -1 },
    { type: 'CH3COO',  label: 'Ac⁻', color: '#9b6ef0', shape: 'hexagon', radius: 13, mass: 1.3, polarity: 0,    charge: -1 },
  ],

  variables: [
    {
      id: 'temperature',
      label: 'Temperature',
      unit: '°C',
      min: 0, max: 100, step: 1, default: 25,
      icon: 'thermometer',
      tooltip: 'Higher temperature shifts the weak-acid equilibrium very slightly toward dissociation, but the contrast between strong and weak is much bigger than the temperature effect.',
    },
  ],

  totalParticles: 80,
  maxParticleCount: 100,
  initialRatio: { HCl: 0.15, CH3COOH: 0.15, H2O: 0.70 },

  speedFromTemp: (temp) => 0.4 + (temp / 100) * 1.2,
  randomGate: 0.5,

  reactions: [
    // Strong acid: fully dissociates (no reverse rule)
    { reactants: ['HCl', 'H2O'], products: ['H', 'Cl'], preserveCatalyst: true, catalystType: 'H2O' },
    // Weak acid: forward dissociation (slow because the reverse beats it)
    { reactants: ['CH3COOH', 'H2O'], products: ['H', 'CH3COO'], preserveCatalyst: true, catalystType: 'H2O' },
    // Weak acid: reverse re-association (favoured ~95 %)
    { reactants: ['H', 'CH3COO'], products: ['CH3COOH', 'H2O'], isReverse: true },
  ],

  activationEnergy: 0.04,
  // Low modifier → reverse reaction strongly favoured for the weak acid
  // (re-association of H+ + CH3COO- back to CH3COOH dominates).
  equilibriumModifier: () => 0.05,

  phConfig: { neutralPH: 7, scale: 2.5 },

  graph: {
    lines: [
      { key: 'HCl',     label: 'HCl (intact)',     color: '#e05555' },
      { key: 'CH3COOH', label: 'CH₃COOH (intact)', color: '#c46b8a' },
      { key: 'H',       label: 'H⁺',                color: '#f0913a' },
    ],
    xLabel: 'Time (s)',
    yLabel: '% of particles',
  },

  annotations: [
    {
      id: 'default',
      text: 'Starting with equal numbers of HCl and CH₃COOH (acetic acid) in water. Watch what happens to each.',
      condition: 'always',
    },
    {
      id: 'strong-dissociated',
      text: 'HCl has fully dissociated into H⁺ + Cl⁻ — that\'s the hallmark of a strong acid. Meanwhile most CH₃COOH molecules are still intact, with only a few H⁺ + CH₃COO⁻ pairs floating around.',
      condition: (vars, stats) => stats?.ph != null && stats.ph < 4,
    },
  ],
}
