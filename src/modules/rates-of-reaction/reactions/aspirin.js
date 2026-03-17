// Hydrolysis of Aspirin: ASA + H2O -> Salicylic Acid + Acetic Acid

export const aspirinReaction = {
  id: 'aspirin',
  name: 'Hydrolysis of Aspirin',
  subtitle: 'ASA + H\u2082O \u2192 Salicylic Acid + Acetic Acid',
  description: 'Aspirin (acetylsalicylic acid) breaks down in the presence of water, especially at high temperatures and extreme pH.',

  guidingQuestion: 'Why do medicines have expiry dates? What conditions cause aspirin to break down fastest?',
  assignmentGoal: 'Investigate how temperature and pH affect the hydrolysis rate. Think about ideal storage conditions for medicines.',

  particleTypes: [
    { type: 'ASA', label: 'ASA', color: '#4f9cf0', shape: 'hexagon', radius: 20, mass: 1.5 },
    { type: 'H2O', label: 'H\u2082O', color: '#8a95a8', shape: 'circle', radius: 8, mass: 0.5 },
    { type: 'SAL', label: 'Sal', color: '#f0913a', shape: 'diamond', radius: 17, mass: 1 },
    { type: 'ACE', label: 'Ace', color: '#3dba7e', shape: 'triangle', radius: 11, mass: 0.8 },
  ],

  variables: [
    {
      id: 'temperature',
      label: 'Temperature',
      unit: '\u00b0C',
      min: 0, max: 100, step: 1, default: 25,
      icon: 'thermometer',
      tooltip: 'Higher temperature speeds up aspirin degradation',
    },
    {
      id: 'concentration',
      label: 'Concentration',
      unit: 'mol/L',
      min: 0.1, max: 2.0, step: 0.1, default: 0.5,
      icon: 'flask',
      tooltip: 'More aspirin molecules in the solution',
    },
    {
      id: 'catalyst',
      label: 'Acid/Base Catalyst',
      type: 'toggle',
      default: false,
      icon: 'zap',
      tooltip: 'Extreme pH (acid or base) accelerates hydrolysis',
    },
  ],

  initialRatio: { ASA: 0.35, H2O: 0.65 },

  activationEnergy: 0.45,
  catalystReduction: 0.5,

  // Activation energy display values (kJ/mol) for the UI
  activationEnergyKJ: 73,
  activationEnergyWithCatalystKJ: 50,

  speedFromTemp: (temp) => 0.4 + (temp / 100) * 2.0,
  countFromConc: (conc, totalParticles) => Math.round(totalParticles * (conc / 2.0)),

  reactions: [
    {
      reactants: ['ASA', 'H2O'],
      products: ['SAL', 'ACE'],
    },
  ],

  graph: {
    lines: [
      { key: 'ASA', label: '[ASA]', color: '#4f9cf0' },
      { key: 'SAL', label: '[Sal]', color: '#f0913a' },
      { key: 'ACE', label: '[Ace]', color: '#3dba7e' },
    ],
    xLabel: 'Time (s)',
    yLabel: 'Concentration',
  },

  annotations: [
    {
      id: 'default',
      text: 'Aspirin (ASA) reacts with water to produce salicylic acid and acetic acid. This is why medicines expire!',
      condition: 'always',
    },
    {
      id: 'high-temp',
      text: 'High temperature accelerates decomposition \u2014 this is why medicines should be stored in cool, dry places.',
      condition: (vars) => vars.temperature >= 60,
    },
    {
      id: 'catalyst-on',
      text: 'Acid/base catalyst active \u2014 extreme pH dramatically speeds up hydrolysis, just like stomach acid.',
      condition: (vars) => vars.catalyst === true,
    },
    {
      id: 'all-consumed',
      text: 'All aspirin has been hydrolysed \u2014 reset to run again.',
      condition: 'allConsumed',
    },
  ],
}
