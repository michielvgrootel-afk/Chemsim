// Ideal gas laws — IB DP Chemistry S1.5 (with S1.4.6 Avogadro's law)
// A container of gas closed by a piston. For the ideal gas, pressure is
// measured from the momentum particles deliver to the walls, so it responds to
// volume, temperature and amount exactly as kinetic theory predicts. In
// real-gas mode it follows the van der Waals equation.

// Particle speed v = sqrt(SPEED_K · T / m) px/s — 280 px/s for N₂ at 300 K.
// Every particle then has the same kinetic energy at a given temperature.
const SPEED_K = 261

export const gasLawsScenario = {
  id: 'gas-laws',
  yearGroups: ['DP1'],
  syllabusRef: 'S1.5',
  name: 'Ideal Gas Laws',
  subtitle: 'PV = nRT',
  description: 'A sealed container of gas with a movable piston. Change the volume, temperature and amount of gas and watch how the pressure, measured from particles hitting the walls, responds.',

  guidingQuestion: 'Why does squeezing, heating or adding gas change its pressure, and when does the ideal gas model stop working?',
  assignmentGoal: 'Use the graph buttons to test each gas law: P vs V at constant temperature (Boyle), P vs T at constant volume, and V vs T with the free piston (Charles). Then switch on "Real gas" and find the conditions where PV/nRT is furthest from 1.',

  particleTypes: [
    { type: 'N2',  label: 'N₂',  color: '#4f9cf0', shape: 'circle',  radius: 4, mass: 1.0,   hideLabel: true },
    { type: 'He',  label: 'He',  color: '#f0c040', shape: 'circle',  radius: 3, mass: 0.143, hideLabel: true },
    { type: 'CO2', label: 'CO₂', color: '#e05555', shape: 'diamond', radius: 5, mass: 1.571, hideLabel: true },
  ],

  variables: [
    {
      id: 'temperature',
      label: 'Temperature',
      unit: 'K',
      min: 50, max: 600, step: 10, default: 300,
      icon: 'thermometer',
      formatValue: (v) => `${v} K (${Math.round(v - 273)} °C)`,
      tooltip: 'Gas laws only work in kelvin: 0 K is where the particles would stop moving. Temperature in °C = K − 273.',
    },
    {
      id: 'volume',
      label: 'Volume',
      unit: 'dm³',
      min: 10, max: 40, step: 0.5, default: 30,
      icon: 'flask',
      visibleWhen: (vars) => !vars.freePiston,
      tooltip: 'Moves the piston. Halve the volume and the particles hit each part of the wall twice as often.',
    },
    {
      id: 'externalPressure',
      label: 'Outside pressure',
      unit: 'kPa',
      min: 50, max: 200, step: 5, default: 100,
      icon: 'flask',
      visibleWhen: (vars) => !!vars.freePiston,
      tooltip: 'The free piston moves until the pressure inside the container equals this outside pressure.',
    },
    {
      id: 'freePiston',
      label: 'Free piston (constant pressure)',
      type: 'toggle',
      default: false,
      tooltip: 'Lets the piston move on its own, like a syringe plunger. Heat the gas and watch the volume change (Charles’s law).',
    },
    {
      id: 'realGas',
      label: 'Real gas',
      type: 'toggle',
      default: false,
      tooltip: 'Gives the particles their own volume and weak attractions to each other. The pressure is then calculated with the van der Waals equation, a corrected PV = nRT. Compare PV/nRT at low temperature and at small volume.',
    },
    {
      id: 'addN2',
      label: 'Add N₂ (0.30 mol)',
      type: 'button',
      icon: 'plus',
      spawn: { type: 'N2', count: 50, region: 'random', spread: 120 },
      cooldownMs: 400,
      tooltip: 'Nitrogen: the reference gas.',
    },
    {
      id: 'addHe',
      label: 'Add He (0.30 mol)',
      type: 'button',
      icon: 'plus',
      spawn: { type: 'He', count: 50, region: 'random', spread: 120 },
      cooldownMs: 400,
      tooltip: 'Helium: light particles that move fast.',
    },
    {
      id: 'addCO2',
      label: 'Add CO₂ (0.30 mol)',
      type: 'button',
      icon: 'plus',
      spawn: { type: 'CO2', count: 50, region: 'random', spread: 120 },
      cooldownMs: 400,
      tooltip: 'Carbon dioxide: heavy particles that move slowly. Does the pressure rise by the same amount as for helium?',
    },
  ],

  totalParticles: 200,
  maxParticleCount: 500,
  initialRatio: { N2: 1 },

  speedFromTemp: (T) => Math.sqrt(SPEED_K * T) / 60,

  gasConfig: {
    maxVolume: 40,          // dm³ with the piston fully out
    minVolume: 10,
    pistonMargin: 18,       // px kept free on the right for the piston plate
    refRadius: 4,           // ideal particle radius used to define the volume
    molPerParticle: 0.006,  // 200 particles = 1.20 mol → ~100 kPa at 300 K, 30 dm³
    speedK: SPEED_K,
    realRadiusScale: 1.3,   // real gas: particles 30 % larger
    attraction: { strength: 2500, range: 14 },
    thermostatRate: 3,      // real gas: velocity resets per particle per second
    // Real-gas pressure (van der Waals). b matches the excluded area of the
    // enlarged particles (~3 dm³/mol); a is exaggerated, like the particle
    // sizes, so deviations show up at this container's pressures.
    vanDerWaals: { a: 5500, b: 3.0 },  // kPa·dm⁶/mol², dm³/mol
    pistonSpeed: 250,       // px/s when following the volume slider
    freePistonGain: 0.6,
    maxTau: 4,              // s — longest pressure-averaging window
    freePistonTau: 0.6,     // s — shorter window while the piston is free
  },

  reactions: [],

  graph: {
    type: 'xy',
    maxPoints: 400,
    plots: [
      { id: 'PV', label: 'P vs V', x: 'V', y: 'P', xLabel: 'Volume (dm³)', yLabel: 'Pressure (kPa)', color: '#4f9cf0', xDomain: [0, 40] },
      { id: 'PT', label: 'P vs T (K)', x: 'T', y: 'P', xLabel: 'Temperature (K)', yLabel: 'Pressure (kPa)', color: '#f0913a', xDomain: [0, 600] },
      { id: 'PTC', label: 'P vs T (°C)', x: 'TC', y: 'P', xLabel: 'Temperature (°C)', yLabel: 'Pressure (kPa)', color: '#e05555', xDomain: [-300, 350] },
      { id: 'VT', label: 'V vs T', x: 'T', y: 'V', xLabel: 'Temperature (K)', yLabel: 'Volume (dm³)', color: '#3dba7e', xDomain: [0, 600], yDomain: [0, 40] },
      { id: 'Pn', label: 'P vs n', x: 'n', y: 'P', xLabel: 'Amount (mol)', yLabel: 'Pressure (kPa)', color: '#9b6ef0', xDomain: [0, 'auto'] },
      { id: 'Z', label: 'PV/nRT vs P', x: 'P', y: 'ratio', xLabel: 'Pressure (kPa)', yLabel: 'PV/nRT', color: '#c46b8a', xDomain: [0, 'auto'], yDomain: [0, 2] },
    ],
  },

  annotations: [
    {
      id: 'default',
      text: 'Each dot is a gas particle. Pressure comes from particles hitting the container walls: more hits, or harder hits, mean higher pressure. Press Resume, then change one variable at a time.',
      condition: 'always',
    },
    {
      id: 'real-attraction',
      text: 'Real gas at low temperature: slow particles are held together by attractions, so fewer of them hit the walls. The pressure is LOWER than PV = nRT predicts.',
      condition: (vars, stats) => vars.realGas && stats?.ratio != null && stats.ratio < 0.88,
    },
    {
      id: 'real-volume',
      text: 'Real gas at high pressure: the particles themselves take up a noticeable share of the space, so they hit the walls more often. The pressure is HIGHER than PV = nRT predicts.',
      condition: (vars, stats) => vars.realGas && stats?.ratio != null && stats.ratio > 1.12,
    },
    {
      id: 'real-ideal',
      text: 'Real gas behaving almost ideally: at high temperature and low pressure, particle volume and attractions barely matter, so PV/nRT stays close to 1.',
      condition: (vars) => vars.realGas,
    },
    {
      id: 'free-piston',
      text: 'Constant pressure: the piston moves until the pressure inside matches the outside. Heat the gas and the volume grows in proportion to the kelvin temperature (Charles’s law).',
      condition: (vars) => vars.freePiston,
    },
    {
      id: 'cold',
      text: 'Very cold: the particles move slowly and hit the walls gently, so the pressure is low. An ideal gas never condenses. Try switching on "Real gas".',
      condition: (vars) => vars.temperature <= 120,
    },
  ],
}
