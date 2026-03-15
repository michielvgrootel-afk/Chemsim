// General Model: A + B -> C
// The simplest reaction - two reactants collide to form one product

export const generalReaction = {
  id: 'general',
  name: 'General Model',
  subtitle: 'A + B \u2192 C',
  description: 'A simple model showing how two reactants combine to form a product.',

  guidingQuestion: 'How do temperature and concentration affect the rate at which particles collide and react?',
  assignmentGoal: 'Explore each variable one at a time. Record which has the largest effect on the reaction rate before moving on to the quiz.',

  particleTypes: [
    { type: 'A', label: 'A', color: '#4f9cf0', shape: 'circle', radius: 14, mass: 1 },
    { type: 'B', label: 'B', color: '#f0913a', shape: 'diamond', radius: 14, mass: 1 },
    { type: 'C', label: 'C', color: '#3dba7e', shape: 'triangle', radius: 16, mass: 2 },
  ],

  variables: [
    {
      id: 'temperature',
      label: 'Temperature',
      unit: '\u00b0C',
      min: 0, max: 100, step: 1, default: 25,
      icon: 'thermometer',
      tooltip: 'Higher temperature \u2192 particles move faster \u2192 more collisions',
    },
    {
      id: 'concentration',
      label: 'Concentration',
      unit: 'mol/L',
      min: 0.1, max: 2.0, step: 0.1, default: 0.5,
      icon: 'flask',
      tooltip: 'More particles in the container \u2192 more collisions per second',
    },
    {
      id: 'catalyst',
      label: 'Catalyst',
      type: 'toggle',
      default: false,
      icon: 'zap',
      tooltip: 'Lowers activation energy \u2014 more collisions succeed',
    },
  ],

  // Initial particle distribution (ratios)
  initialRatio: { A: 0.5, B: 0.5 },

  // Activation energy threshold (relative, 0-1)
  activationEnergy: 0.4,
  catalystReduction: 0.5, // catalyst reduces activation energy by 50%

  // Speed multiplier based on temperature
  speedFromTemp: (temp) => 0.5 + (temp / 100) * 2.5,

  // Particle count from concentration
  countFromConc: (conc, totalParticles) => Math.round(totalParticles * (conc / 2.0)),

  // Reaction rules
  reactions: [
    {
      reactants: ['A', 'B'],
      products: ['C'],
      // Product spawns at midpoint of reactants
    },
  ],

  // Graph configuration
  graph: {
    lines: [
      { key: 'A', label: '[A]', color: '#4f9cf0' },
      { key: 'B', label: '[B]', color: '#f0913a' },
      { key: 'C', label: '[C]', color: '#3dba7e' },
    ],
    xLabel: 'Time (s)',
    yLabel: 'Concentration',
  },

  // Annotations that appear during simulation
  annotations: [
    {
      id: 'default',
      text: 'Watch for collisions between blue (A) and orange (B) particles \u2014 only high-energy collisions produce a reaction.',
      condition: 'always',
    },
    {
      id: 'high-temp',
      text: 'High temperature! Particles are moving very fast \u2014 notice how the reaction rate increases significantly.',
      condition: (vars) => vars.temperature >= 75,
    },
    {
      id: 'catalyst-on',
      text: 'Catalyst active \u2014 the activation energy is lowered, so more collisions result in successful reactions.',
      condition: (vars) => vars.catalyst === true,
    },
    {
      id: 'all-consumed',
      text: 'All reactants used up \u2014 reset to run again.',
      condition: 'allConsumed',
    },
  ],
}
