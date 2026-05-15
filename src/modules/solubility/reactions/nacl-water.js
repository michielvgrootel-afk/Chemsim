// NaCl dissolving in Water — ionic dissolution
// Na+ and Cl- ions in a crystal lattice pulled apart by polar water molecules

export const naclWaterScenario = {
  id: 'nacl-water',
  name: 'Salt in Water',
  subtitle: 'NaCl dissolves in H\u2082O',
  description: 'Watch polar water molecules pull apart an ionic crystal lattice. The partial charges on water attract Na\u207a and Cl\u207b ions, breaking the crystal apart.',

  guidingQuestion: 'Why does table salt disappear when you stir it into water?',
  assignmentGoal: 'Observe how water molecules surround and separate the ions. Try changing the temperature to see its effect on dissolution speed.',

  particleTypes: [
    // `charge` carries the formal ionic charge (+1 / -1). It's separate from
    // `polarity` (which the "like dissolves like" force model uses as a scalar
    // magnitude) so that same-charge ions can repel each other electrostatically.
    { type: 'Na', label: 'Na\u207a', color: '#4f9cf0', shape: 'circle', radius: 14, mass: 1.2, polarity: 0.9, charge: +1 },
    { type: 'Cl', label: 'Cl\u207b', color: '#3dba7e', shape: 'circle', radius: 16, mass: 1.5, polarity: 0.9, charge: -1 },
    { type: 'H2O', label: 'H\u2082O', color: '#8ab4f0', shape: 'diamond', radius: 7, mass: 0.8, polarity: 0.85, charge: 0 },
  ],

  variables: [
    {
      id: 'temperature',
      label: 'Temperature',
      unit: '\u00b0C',
      min: 0, max: 100, step: 1, default: 25,
      icon: 'thermometer',
      tooltip: 'Higher temperature increases kinetic energy, speeding up dissolution.',
    },
    {
      id: 'stirring',
      label: 'Stirring',
      type: 'toggle',
      default: false,
      icon: 'zap',
      tooltip: 'Stirring moves fresh solvent past the crystal, speeding up dissolution.',
    },
  ],

  // Solubility-specific config
  hasPolarityForces: true,
  soluteTypes: ['Na', 'Cl'],
  solventTypes: ['H2O'],

  // Spawn solute as alternating grid (crystal lattice)
  spawnMode: 'lattice',
  latticeConfig: {
    types: ['Na', 'Cl'],  // Alternating pattern (Na/Cl/Na/Cl... checkerboard)
    cols: 4,
    rows: 4,
    spacing: 38,
    offsetX: 0.2,   // Fraction of canvas width for lattice center
    offsetY: 0.5,
    bound: true,     // Lock ions in place until hydrated
    solventCount: 300,  // Override: fill container with water (~19:1 water:ion ratio)
                        // Bumped from 220 → 300 to keep plenty of free solvent
                        // around the larger 4x4 crystal (16 ions × ~5.5 waters
                        // per shell = ~88 waters needed at full dissolution)
  },

  // Hydration-based dissolution: ions break free when enough water surrounds them
  // Per-type thresholds reflect real coordination numbers in aqueous solution
  // Na+ inner-sphere hydration: ~4-6 waters; Cl- inner-sphere: ~6 waters
  // Gating is REVERSIBLE — if an ion's hydration shell drops below threshold,
  // it stops moving (vx=vy=0) and waits until the shell rebuilds
  hydrationConfig: {
    radius: 32,          // px — tight inner hydration sphere (must touch the ion)
                         //       at this radius, bulk water density gives ~2 waters per sphere,
                         //       so an ion only "feels mobile" once it has actively recruited
                         //       enough waters via ion-dipole attraction
    thresholds: {        // water molecules needed to MOVE
      Na: 5,             // Na+ : 5 waters in shell to be mobile (real Na+ shell: 4-6)
      Cl: 6,             // Cl- : 6 waters in shell to be mobile (real Cl- shell: ~6)
    },
    threshold: 6,        // fallback if a type isn't listed in thresholds{}
    checkInterval: 0.15, // seconds — frequent re-evaluation so freezing feels responsive
  },

  // Lattice mode: polarity forces only act on water near BOUND lattice ions
  // Once freed, ions move via elastic collisions only (prevents water piling on freed ions)
  polarityConfig: {
    latticeMode: true,
    attractStrength: 170,      // Firm ion-dipole pull. Combined with exclusive bonding
                               // (only one ion can pull a given water), this is what
                               // makes hydration shells stick a little longer.
    soluteDamping: 0,          // No solute-solute polarity forces
    solventDamping: 0,         // No water-water polarity forces
    soluteMultiplier: 1,
  },

  initialRatio: { Na: 0.05, Cl: 0.05, H2O: 0.9 },

  speedFromTemp: (temp) => 0.3 + (temp / 100) * 2.0,

  // No chemical reactions — dissolution is force-based
  reactions: [],

  graph: {
    lines: [
      { key: 'dissolved', label: '% Dissolved', color: '#4f9cf0' },
    ],
    xLabel: 'Time (s)',
    yLabel: '% Dissolved',
  },

  annotations: [
    {
      id: 'default',
      text: 'Sodium chloride (NaCl) is an ionic compound \u2014 Na\u207a and Cl\u207b are held together by electrostatic attraction in a crystal lattice. Watch how polar water molecules surround and pull the ions apart.',
      condition: 'always',
    },
    {
      id: 'dissolving',
      text: 'The ions are being hydrated! Water molecules orient their partial charges toward each ion \u2014 \u03b4\u207b oxygen faces Na\u207a, \u03b4\u207a hydrogen faces Cl\u207b. This is dissolution in action.',
      condition: (vars, stats) => stats?.dissolutionPercent > 20 && stats?.dissolutionPercent < 80,
    },
    {
      id: 'dissolved',
      text: 'The crystal lattice has fully dissolved! Each ion is now surrounded by a hydration shell of water molecules. The solution is clear because the ions are too small to scatter light.',
      condition: (vars, stats) => stats?.dissolutionPercent >= 80,
    },
    {
      id: 'cold',
      text: 'Low temperature \u2014 particles move slowly, so dissolution takes longer. But NaCl is highly soluble even in cold water!',
      condition: (vars) => vars.temperature <= 10,
    },
    {
      id: 'hot',
      text: 'High temperature increases kinetic energy \u2014 water molecules collide with the crystal more forcefully, speeding up dissolution.',
      condition: (vars) => vars.temperature >= 70,
    },
    {
      id: 'stirring',
      text: 'Stirring moves fresh water past the crystal surface, carrying dissolved ions away and exposing more surface to solvent. This speeds up dissolution but doesn\u2019t change total solubility.',
      condition: (vars) => vars.stirring,
    },
  ],
}
