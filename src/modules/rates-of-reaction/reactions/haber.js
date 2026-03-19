// Haber Process: N2 + 3H2 <=> 2NH3 (reversible, equilibrium)

export const haberReaction = {
  id: 'haber',
  name: 'Haber Process',
  subtitle: 'N\u2082 + 3H\u2082 \u21cc 2NH\u2083',
  description: 'The industrial synthesis of ammonia. A reversible reaction where equilibrium position depends on temperature and pressure.',

  guidingQuestion: "Why doesn't industry just use the conditions that give the highest yield? What's the trade-off?",
  assignmentGoal: 'Allow the system to reach equilibrium, then change one variable. Observe how the equilibrium position shifts.',

  particleTypes: [
    { type: 'N2', label: 'N\u2082', color: '#4f9cf0', shape: 'circle', radius: 12, mass: 2 },
    { type: 'H2', label: 'H\u2082', color: '#f0c040', shape: 'diamond', radius: 8, mass: 0.5 },
    { type: 'NH3', label: 'NH\u2083', color: '#3dba7e', shape: 'triangle', radius: 20, mass: 1.2 },
  ],

  variables: [
    {
      id: 'temperature',
      label: 'Temperature',
      unit: '\u00b0C',
      min: 200, max: 600, step: 10, default: 450,
      icon: 'thermometer',
      tooltip: 'Higher temp increases rate but shifts equilibrium toward reactants (exothermic forward reaction)',
    },
    {
      id: 'concentration',
      label: 'Pressure',
      unit: 'atm',
      min: 50, max: 300, step: 10, default: 200,
      icon: 'flask',
      tooltip: 'Higher pressure favours the forward reaction (fewer gas moles on product side)',
    },
    {
      id: 'catalyst',
      label: 'Iron Catalyst',
      type: 'toggle',
      default: true,
      icon: 'zap',
      tooltip: 'Iron catalyst surface \u2014 N\u2082 and H\u2082 adsorb onto the surface, react, and NH\u2083 desorbs. Without it, the reaction is extremely slow.',
    },
  ],

  initialRatio: { N2: 0.25, H2: 0.75 },

  hasCatalystSurface: true,  // Enables heterogeneous catalyst surface mechanism
  activationEnergy: 0.95,   // Very high — homogeneous reaction is extremely slow without catalyst
  catalystReduction: 0.45,
  homogeneousGate: 0.02,    // Only 2% chance per collision without catalyst (vs 30% normally)

  // Activation energy display values (kJ/mol) for the UI
  activationEnergyKJ: 230,
  activationEnergyWithCatalystKJ: 150,

  speedFromTemp: (temp) => 0.3 + ((temp - 200) / 400) * 2.5,

  countFromConc: (pressure, totalParticles) => Math.round(totalParticles * (pressure / 300)),

  // Reversible reaction
  reactions: [
    {
      reactants: ['N2', 'H2'],
      products: ['NH3', 'NH3'],
      // Forward reaction
    },
    {
      reactants: ['NH3', 'NH3'],
      products: ['N2', 'H2'],
      isReverse: true,
      // Reverse reaction - favoured at high temperature
    },
  ],

  // Equilibrium: higher temp favours reverse, higher pressure favours forward
  equilibriumModifier: (vars) => {
    // Returns a value 0-1 where higher means more forward reaction
    const tempEffect = 1 - ((vars.temperature - 200) / 400) * 0.6
    const pressureEffect = (vars.concentration - 50) / 250 * 0.4
    return Math.max(0.1, Math.min(0.9, 0.3 + tempEffect * 0.3 + pressureEffect))
  },

  reversible: true,

  graph: {
    lines: [
      { key: 'N2', label: '[N\u2082]', color: '#4f9cf0' },
      { key: 'H2', label: '[H\u2082]', color: '#f0c040' },
      { key: 'NH3', label: '[NH\u2083]', color: '#3dba7e' },
    ],
    xLabel: 'Time (s)',
    yLabel: 'Concentration',
  },

  annotations: [
    {
      id: 'default',
      text: 'Without the iron catalyst, this reaction barely happens. Toggle the catalyst ON to see N\u2082 and H\u2082 adsorb onto the surface and react!',
      condition: 'always',
    },
    {
      id: 'high-temp',
      text: 'High temperature increases reaction rate but shifts equilibrium toward reactants \u2014 lower NH\u2083 yield. Industry compromise: 450\u00b0C.',
      condition: (vars) => vars.temperature >= 500,
    },
    {
      id: 'high-pressure',
      text: 'High pressure favours the forward reaction (4 gas moles \u2192 2 moles). Industry uses 200 atm.',
      condition: (vars) => vars.concentration >= 250,
    },
    {
      id: 'catalyst-on',
      text: 'Iron catalyst surface active \u2014 N\u2082 and H\u2082 adsorb, react on the surface, and NH\u2083 desorbs upward. The catalyst speeds up both directions equally.',
      condition: (vars) => vars.catalyst === true,
    },
    {
      id: 'low-temp',
      text: 'Low temperature gives higher NH\u2083 yield at equilibrium, but the rate is too slow to be practical.',
      condition: (vars) => vars.temperature <= 300,
    },
  ],
}
