// Fermentation of Glucose: C6H12O6 -> 2C2H5OH + 2CO2 (enzyme-catalysed)

export const fermentationReaction = {
  id: 'fermentation',
  name: 'Fermentation of Glucose',
  subtitle: 'C\u2086H\u2081\u2082O\u2086 \u2192 2C\u2082H\u2085OH + 2CO\u2082',
  description: 'Yeast enzymes break down glucose into ethanol and carbon dioxide. Temperature is critical \u2014 too hot denatures the enzyme.',

  guidingQuestion: 'Why does bread dough rise faster in a warm kitchen than a cold one?',
  assignmentGoal: 'Find the temperature that gives the fastest fermentation rate. Observe what happens if the temperature is too high.',

  particleTypes: [
    { type: 'GLU', label: 'Glu', color: '#f0c040', shape: 'hexagon', radius: 22, mass: 2 },
    { type: 'ENZ', label: 'Enz', color: '#9b6ef0', shape: 'star', radius: 16, mass: 1 },
    { type: 'ETH', label: 'EtOH', color: '#3dba7e', shape: 'circle', radius: 11, mass: 0.8 },
    { type: 'CO2', label: 'CO\u2082', color: '#e05555', shape: 'diamond', radius: 9, mass: 0.5 },
  ],

  variables: [
    {
      id: 'temperature',
      label: 'Temperature',
      unit: '\u00b0C',
      min: 0, max: 80, step: 1, default: 35,
      icon: 'thermometer',
      tooltip: 'Enzyme activity peaks around 35-40\u00b0C. Above 60\u00b0C the enzyme denatures.',
    },
    {
      id: 'concentration',
      label: 'Glucose Concentration',
      unit: 'mol/L',
      min: 0.1, max: 2.0, step: 0.1, default: 0.5,
      icon: 'flask',
      tooltip: 'More glucose molecules available for fermentation',
    },
  ],

  initialRatio: { GLU: 0.6, ENZ: 0.4 },

  activationEnergy: 0.3,
  catalystReduction: 0, // enzyme is always present, not a toggle

  // Activation energy display values (kJ/mol) for the UI
  // Enzyme lowers Ea dramatically compared to uncatalysed glucose decomposition
  activationEnergyKJ: 200,
  activationEnergyWithCatalystKJ: 50,

  // Enzyme activity curve: peaks at ~37C, drops sharply above 60C (denaturation)
  speedFromTemp: (temp) => {
    if (temp <= 0) return 0.1
    if (temp <= 37) return 0.3 + (temp / 37) * 2.0
    if (temp <= 60) return 2.3 - ((temp - 37) / 23) * 1.0
    // Denaturation: enzyme activity drops to near zero
    return Math.max(0.05, 1.3 - ((temp - 60) / 20) * 1.3)
  },

  countFromConc: (conc, totalParticles) => Math.round(totalParticles * (conc / 2.0)),

  reactions: [
    {
      reactants: ['GLU', 'ENZ'],
      products: ['ETH', 'CO2'],
      preserveCatalyst: true, // enzyme is not consumed
    },
  ],

  graph: {
    lines: [
      { key: 'GLU', label: '[Glucose]', color: '#f0c040' },
      { key: 'ETH', label: '[Ethanol]', color: '#3dba7e' },
      { key: 'CO2', label: '[CO\u2082]', color: '#e05555' },
    ],
    xLabel: 'Time (s)',
    yLabel: 'Concentration',
  },

  annotations: [
    {
      id: 'default',
      text: 'Glucose is broken down by enzymes (purple stars) into ethanol and CO\u2082. The enzyme is not consumed \u2014 it acts as a biological catalyst.',
      condition: 'always',
    },
    {
      id: 'optimal',
      text: 'Optimal temperature range (35-40\u00b0C) \u2014 enzyme activity is at its peak. This is body temperature!',
      condition: (vars) => vars.temperature >= 33 && vars.temperature <= 42,
    },
    {
      id: 'denaturation',
      text: '\u26a0\ufe0f Approaching denaturation temperature! Above 60\u00b0C, the enzyme unfolds and stops working permanently.',
      condition: (vars) => vars.temperature >= 55,
    },
    {
      id: 'cold',
      text: 'Low temperature \u2014 enzyme activity is very slow. This is why dough rises slowly in a cold kitchen.',
      condition: (vars) => vars.temperature <= 15,
    },
    {
      id: 'all-consumed',
      text: 'All glucose has been fermented \u2014 reset to run again.',
      condition: 'allConsumed',
    },
  ],
}
