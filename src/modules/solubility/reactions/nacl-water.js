// NaCl dissolving in Water — ionic dissolution
// Na+ and Cl- ions in a crystal lattice pulled apart by polar water molecules

// Crystal sizes for the setup slider (cols × rows). Every size has an even
// number of ions, so the checkerboard holds equal Na⁺ and Cl⁻ (neutral, 1:1).
const CRYSTAL_SIZES = [[2, 2], [4, 2], [4, 3], [4, 4], [5, 4], [6, 4], [6, 5], [6, 6]]

export const naclWaterScenario = {
  id: 'nacl-water',
  yearGroups: ['MYP5', 'DP1'],
  syllabusRef: 'S2.1',
  name: 'Salt in Water',
  subtitle: 'NaCl dissolves in H\u2082O',
  description: 'Watch polar water molecules pull apart an ionic crystal lattice. Each water molecule is drawn as a red oxygen (\u03b4\u207b) with two white hydrogens (\u03b4\u207a); the partial charges attract Na\u207a and Cl\u207b ions, breaking the crystal apart.',

  guidingQuestion: 'Why does table salt disappear when you stir it into water?',
  assignmentGoal: 'Observe how water molecules surround and separate the ions. Try changing the temperature to see its effect on dissolution speed.',

  particleTypes: [
    // `charge` carries the formal ionic charge (+1 / -1). It's separate from
    // `polarity` (which the "like dissolves like" force model uses as a scalar
    // magnitude) so that same-charge ions can repel each other electrostatically.
    //
    // Ion sizes follow real ionic radii (Na\u207a 102 pm, Cl\u207b 181 pm, ratio 1.77).
    // Water is drawn as a bent molecule (red O, white H's) and kept smaller
    // than true scale so the container can hold enough of it.
    { type: 'Na', label: 'Na\u207a', color: '#4f9cf0', shape: 'circle', radius: 12, mass: 1.2, polarity: 0.9, charge: +1 },
    { type: 'Cl', label: 'Cl\u207b', color: '#3dba7e', shape: 'circle', radius: 21, mass: 1.5, polarity: 0.9, charge: -1 },
    { type: 'H2O', label: 'H\u2082O', color: '#e05555', shape: 'water', radius: 7, mass: 0.8, polarity: 0.85, charge: 0, hideLabel: true },
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
      tooltip: 'Stirring carries the crystal around and sweeps fresh water past its surface, so it dissolves faster. It doesn’t change how much salt can dissolve.',
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
    sizes: CRYSTAL_SIZES, // chosen with the "Crystal size" setup slider
    cols: 4,          // fallback size when no slider value is given
    rows: 4,
    spacing: 34,      // Na⁺ and Cl⁻ just touching (12 + 21 px), as in a real crystal
    offsetX: 0.2,   // Fraction of canvas width for lattice center
    offsetY: 0.5,
    bound: true,     // Lock ions in place until hydrated
    solventCount: 300,  // fallback water count when no slider value is given
  },

  // Setup sliders shown instead of per-ion counts: the ions come as a
  // crystal, so students choose its size and how much water surrounds it.
  // Each ion needs a shell of 5–6 waters, so very little water cannot
  // dissolve a big crystal completely.
  setupControls: [
    {
      id: 'latticeSize',
      label: 'Crystal size',
      min: 0, max: CRYSTAL_SIZES.length - 1, step: 1, default: 3,
      format: (i) => `${CRYSTAL_SIZES[i][0]} × ${CRYSTAL_SIZES[i][1]} (${CRYSTAL_SIZES[i][0] * CRYSTAL_SIZES[i][1]} ions)`,
    },
    {
      id: 'H2O',
      label: 'Water molecules',
      min: 100, max: 500, step: 10, default: 300,
    },
  ],

  // Hydration-based dissolution: ions break free when enough water surrounds them
  // Per-type thresholds reflect real coordination numbers in aqueous solution
  // Na+ inner-sphere hydration: ~4-6 waters; Cl- inner-sphere: ~6 waters
  // Gating is REVERSIBLE — if an ion's hydration shell drops below threshold,
  // it stops moving (vx=vy=0) and waits until the shell rebuilds
  hydrationConfig: {
    radii: {             // px, centre to centre — inner hydration sphere around each ion:
      Na: 34,            //       a touching water sits at 12 + 7 = 19 px from Na⁺
      Cl: 42,            //       and at 21 + 7 = 28 px from Cl⁻; the extra room lets a
    },                   //       partly buried surface ion still gather its shell. Bulk
                         //       water alone gives ~2–3 waters per sphere, so an ion only
                         //       "feels mobile" once it has actively recruited more
    radius: 32,          // fallback for types not listed in radii{}
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
    ionRepelRangeFactor: 1.8,  // like charges repel within 1.8 × (rA + rB), so the
                               // gap scales with ion size (big Cl⁻ keep further apart)
    forceReferenceTemp: 25,    // the strengths above are for 25 °C and scale with the
                               // water's kinetic energy (∝ speed²). Real ion–water
                               // attraction is far stronger than thermal motion at any
                               // temperature from 0–100 °C, so hot water still hydrates
                               // ions. With fixed forces, fast hot water flew straight
                               // past the ions and dissolving got SLOWER above ~25 °C.
  },

  // Stirring flow: divergence-free cells, so the water stays evenly spread
  // (the default 'gyres' flow is built to break up oil/water layers)
  stirConfig: { field: 'cellular', speed: 180, steer: 14 },

  // The undissolved crystal moves as one rigid solid (src/engine/crystal.js)
  crystalConfig: {
    flowFollow: 0.35,     // crystal moves at ~35 % of the stirring flow (heavy solid)
    responseRate: 1.5,    // 1/s — how quickly it picks up the flow
    settleRate: 2.5,      // 1/s — how quickly it stops after stirring ends
    maxSpin: 1.0,         // rad/s
    restitution: 0.3,     // bounce off the container walls
    boundaryLayer: 30,    // px — water this close to the crystal moves with it
  },

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
      text: 'Sodium chloride (NaCl) is an ionic compound \u2014 Na\u207a and Cl\u207b are held together by electrostatic attraction in a crystal lattice. Notice that Cl\u207b is much bigger than Na\u207a. Each water molecule is a red oxygen (\u03b4\u207b) with two white hydrogens (\u03b4\u207a): watch how they surround and pull the ions apart.',
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
      text: 'Stirring carries the whole crystal around and sweeps fresh water past its surface, while dissolved ions are carried away. The stirring doesn\u2019t tear ions out \u2014 each one still has to be surrounded by water before it leaves. This speeds up dissolution but doesn\u2019t change total solubility.',
      condition: (vars) => vars.stirring,
    },
  ],
}
