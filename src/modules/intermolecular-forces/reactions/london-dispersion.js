// London Dispersion Forces — a close-up of two molecules with every electron
// drawn (page: 'imf-lab', see src/components/imflab/). The electrons'
// fluctuating distribution makes temporary dipoles that induce dipoles in
// the neighbour; the boiling-point graph shows what that means in bulk.
//
// Structures are displayed formulas in units of one C–C bond (62 px).
// Data: boiling and melting points (°C), molar mass (g mol⁻¹) and enthalpy
// of vaporisation at the boiling point (kJ mol⁻¹, the energy to separate
// the molecules; it sets the average of the attraction meter).

import { halogenBond } from '../../../engine/imfModel'

const CH = 0.71   // C–H and O–H bond length in units (44 px)
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }

// A displayed formula: heavy atoms + bonds, then hydrogens added around
// atoms in the given directions, e.g. [0, 'up', 'down', 'left']
function displayed(heavy, bonds, hydrogens, extra = {}) {
  const atoms = heavy.map(([el, x, y]) => ({ el, x, y }))
  const allBonds = bonds.map(([i, j, order = 1]) => [i, j, order])
  for (const [i, ...dirs] of hydrogens) {
    for (const d of dirs) {
      const [dx, dy] = DIRS[d]
      atoms.push({ el: 'H', x: atoms[i].x + dx * CH, y: atoms[i].y + dy * CH })
      allBonds.push([i, atoms.length - 1, 1])
    }
  }
  return { atoms, bonds: allBonds, ...extra }
}

// Straight-chain alkane CnH2n+2
function alkane(n) {
  const heavy = Array.from({ length: n }, (_, i) => ['C', i - (n - 1) / 2, 0])
  const bonds = Array.from({ length: n - 1 }, (_, i) => [i, i + 1])
  const hydrogens = heavy.map((_, i) => [i, 'up', 'down'])
  hydrogens[0].push('left')
  hydrogens[n - 1].push('right')
  return displayed(heavy, bonds, hydrogens)
}

// Diatomic halogen X₂: three lone pairs on each atom
function halogen(el) {
  const d = halogenBond(el) / 2
  return {
    atoms: [{ el, x: -d, y: 0 }, { el, x: d, y: 0 }],
    bonds: [[0, 1, 1]],
    lonePairs: [[0, -1, 0], [0, 0, -1], [0, 0, 1], [1, 1, 0], [1, 0, -1], [1, 0, 1]],
  }
}

const LONDON = ['London']
const DIPOLE = ['London', 'dipole–dipole']
const HBOND = ['London', 'dipole–dipole', 'hydrogen bonds']

const ALKANE_NAMES = ['Methane', 'Ethane', 'Propane', 'Butane', 'Pentane', 'Hexane', 'Heptane', 'Octane']
const ALKANE_FORMULAS = ['CH₄', 'C₂H₆', 'C₃H₈', 'C₄H₁₀', 'C₅H₁₂', 'C₆H₁₄', 'C₇H₁₆', 'C₈H₁₈']
const ALKANE_DATA = [   // bp, mp, Mr, ΔHvap
  [-161.5, -182.5, 16.04, 8.19],
  [-88.6, -182.8, 30.07, 14.69],
  [-42.1, -187.7, 44.1, 19.04],
  [-0.5, -138.3, 58.12, 22.44],
  [36.1, -129.7, 72.15, 25.79],
  [68.7, -95.3, 86.18, 28.85],
  [98.4, -90.6, 100.2, 31.77],
  [125.6, -56.8, 114.23, 34.41],
]
const ALKANE_NOTES = [
  'Methane is small, with only 10 electrons, and touches its neighbour over a short distance. Its temporary dipoles are small, so the London forces between its molecules are weak.',
  'Ethane has 18 electrons, almost twice as many as methane, and a longer contact with its neighbour, so the London forces are stronger.',
  'Each extra CH₂ group adds 8 electrons and makes the chain longer: more electrons to shift and more contact where temporary dipoles can line up.',
  'Butane: 34 electrons. Watch the electrons shift up or down in different patches along the chain, and how the side of the molecule below that faces a δ− always becomes δ+.',
  'Pentane: 42 electrons along five carbons. A longer chain can have several temporary dipoles at once, each inducing one in its neighbour.',
  'Hexane: 50 electrons. More electrons and a longer contact mean more induced dipoles at any moment, so the molecules hold on to each other more strongly.',
  'Heptane: 58 electrons. Notice how the attraction lines appear all along the chain, not just at the ends.',
  'Octane has 66 electrons along a long chain lying next to its neighbour: temporary dipoles form all along it at once. More electrons and more contact → stronger London forces → a higher boiling point.',
]

const alkanes = ALKANE_NAMES.map((name, i) => {
  const [bp, mp, mr, dHvap] = ALKANE_DATA[i]
  return {
    id: name.toLowerCase(), name, formula: ALKANE_FORMULAS[i], axis: String(i + 1),
    bp, mp, mr, dHvap, forces: LONDON, electrons: 8 * (i + 1) + 2,
    structure: alkane(i + 1), note: ALKANE_NOTES[i],
  }
})

export const londonDispersionScenario = {
  id: 'london-dispersion',
  yearGroups: ['MYP4', 'MYP5', 'DP1'],
  syllabusRef: 'S2.2',
  name: 'London Dispersion Forces',
  subtitle: 'Why bigger molecules boil at higher temperatures',
  description: 'See every electron in two neighbouring molecules. Temporary dipoles induce dipoles in the neighbour, and the attraction between them decides the boiling point. Compare alkanes, branched isomers, halogens and polar molecules.',

  guidingQuestion: 'Non-polar molecules like the alkanes still attract each other. Where does that attraction come from, and why does it grow as the molecules get bigger?',
  assignmentGoal: 'Compare methane with octane: count the electrons and watch the temporary dipoles. Then compare pentane with its branched isomers, and the halogens. Predict each boiling point before you check it.',

  page: 'imf-lab',

  sets: [
    {
      id: 'alkanes',
      label: 'Alkanes',
      title: 'Boiling points of the alkanes',
      axisLabel: 'Number of carbon atoms',
      trend: true,
      molecules: alkanes,
    },
    {
      id: 'branching',
      label: 'Branching',
      title: 'Boiling points of the C₅H₁₂ isomers',
      axisLabel: 'Isomer (all C₅H₁₂, 42 electrons)',
      trend: false,
      molecules: [
        { ...alkanes[4], axis: 'pentane',
          note: 'Straight-chain pentane lies along its neighbour over five carbons: a long contact where many induced dipoles can line up.' },
        {
          id: '2-methylbutane', name: '2-Methylbutane', formula: 'C₅H₁₂', axis: '2-methylbutane',
          bp: 27.8, mp: -159.9, mr: 72.15, dHvap: 24.69, forces: LONDON, electrons: 42,
          structure: displayed(
            [['C', -1.5, 0], ['C', -0.5, 0], ['C', 0.5, 0], ['C', 1.5, 0], ['C', -0.5, -1]],
            [[0, 1], [1, 2], [2, 3], [1, 4]],
            [[0, 'up', 'down', 'left'], [1, 'down'], [2, 'up', 'down'], [3, 'up', 'down', 'right'], [4, 'up', 'left', 'right']],
          ),
          arrangement: { flipY: true },   // branches point away from each other
          note: 'The branch makes 2-methylbutane shorter: less of it touches its neighbour, so the London forces are a little weaker. It has the same 42 electrons as pentane!',
        },
        {
          id: '2-2-dimethylpropane', name: '2,2-Dimethylpropane', formula: 'C₅H₁₂', axis: '2,2-dimethylpropane',
          bp: 9.5, mp: -16.6, mr: 72.15, dHvap: 22.74, forces: LONDON, electrons: 42,
          structure: displayed(
            [['C', 0, 0], ['C', -1, 0], ['C', 1, 0], ['C', 0, -1], ['C', 0, 1]],
            [[0, 1], [0, 2], [0, 3], [0, 4]],
            [[1, 'up', 'down', 'left'], [2, 'up', 'down', 'right'], [3, 'up', 'left', 'right'], [4, 'down', 'left', 'right']],
          ),
          note: 'Same 42 electrons as pentane, but 2,2-dimethylpropane is almost a ball: it touches its neighbour at only one small spot. Few induced dipoles can line up, so its London forces are the weakest of the three.',
        },
      ],
    },
    {
      id: 'halogens',
      label: 'Halogens',
      title: 'Boiling points of the halogens',
      axisLabel: 'Halogen (number of electrons)',
      trend: true,
      molecules: [
        { id: 'fluorine', name: 'Fluorine', formula: 'F₂', axis: 'F₂ (18)', bp: -188.1, mp: -219.6, mr: 38.0, dHvap: 6.62,
          forces: LONDON, electrons: 18, structure: halogen('F'),
          note: 'Fluorine has 18 electrons, held tightly close to the nuclei. Its electron cloud is small and hard to distort, so its temporary dipoles are tiny.' },
        { id: 'chlorine', name: 'Chlorine', formula: 'Cl₂', axis: 'Cl₂ (34)', bp: -34.0, mp: -101.5, mr: 70.9, dHvap: 20.41,
          forces: LONDON, electrons: 34, structure: halogen('Cl'),
          note: 'Chlorine has 34 electrons and an extra shell: its outer electrons are further from the nucleus and more easily pushed around.' },
        { id: 'bromine', name: 'Bromine', formula: 'Br₂', axis: 'Br₂ (70)', bp: 58.8, mp: -7.2, mr: 159.8, dHvap: 29.96,
          forces: LONDON, electrons: 70, structure: halogen('Br'),
          note: 'Bromine has 70 electrons in four shells. A bigger, softer electron cloud gives bigger temporary dipoles and stronger London forces.' },
        { id: 'iodine', name: 'Iodine', formula: 'I₂', axis: 'I₂ (106)', bp: 184.3, mp: 113.7, mr: 253.8, dHvap: 41.57,
          forces: LONDON, electrons: 106, structure: halogen('I'),
          note: 'Iodine has 106 electrons, many in outer shells far from the nucleus. Its big electron cloud is easily distorted, so its temporary dipoles are large and its London forces strong.' },
      ],
    },
    {
      id: 'polar',
      label: 'Polar (DP 1)',
      title: 'Same size, different forces',
      axisLabel: 'Molecule (each has about 25 electrons)',
      trend: false,
      molecules: [
        { ...alkanes[2], axis: 'propane',
          note: 'Propane is non-polar: C and H have almost the same electronegativity. Only London forces hold its molecules together.' },
        {
          id: 'methoxymethane', name: 'Methoxymethane', formula: 'CH₃OCH₃', axis: 'methoxymethane',
          bp: -24.8, mp: -141.5, mr: 46.07, dHvap: 21.51, forces: DIPOLE, electrons: 26,
          structure: displayed(
            [['C', -1, 0], ['O', 0, 0], ['C', 1, 0]],
            [[0, 1], [1, 2]],
            [[0, 'up', 'down', 'left'], [2, 'up', 'down', 'right']],
            { lonePairs: [[1, 0, -1], [1, 0, 1]], charges: [[1, 0.55], [0, -0.25], [2, -0.25]] },
          ),
          arrangement: { dx: 1 },   // δ+ carbon under δ− oxygen
          note: 'Oxygen pulls electrons towards itself: a permanent dipole (O δ−, C δ+). Neighbours line up δ+ to δ−, adding dipole–dipole forces to the London forces. There is no O–H, so no hydrogen bonds.',
        },
        {
          id: 'ethanal', name: 'Ethanal', formula: 'CH₃CHO', axis: 'ethanal',
          bp: 20.2, mp: -123.4, mr: 44.05, dHvap: 25.76, forces: DIPOLE, electrons: 24,
          structure: displayed(
            [['C', -1, 0], ['C', 0, 0], ['O', 1, 0]],
            [[0, 1], [1, 2, 2]],
            [[0, 'up', 'down', 'left'], [1, 'down']],
            { lonePairs: [[2, 0.6, -0.8], [2, 0.6, 0.8]], charges: [[2, 0.65], [1, -0.45]] },
          ),
          arrangement: { dx: 1, mirror: true },   // C=O dipoles side by side, opposite ways
          note: 'The C=O bond is strongly polar, so ethanal has a bigger permanent dipole than methoxymethane and stronger dipole–dipole forces.',
        },
        {
          id: 'ethanol', name: 'Ethanol', formula: 'C₂H₅OH', axis: 'ethanol',
          bp: 78.4, mp: -114.1, mr: 46.07, dHvap: 38.56, forces: HBOND, electrons: 26,
          structure: displayed(
            [['C', -1.5, 0], ['C', -0.5, 0], ['O', 0.5, 0], ['H', 0.5 + CH, 0]],
            [[0, 1], [1, 2], [2, 3]],
            [[0, 'up', 'down', 'left'], [1, 'up', 'down']],
            { lonePairs: [[2, 0, -1], [2, 0, 1]], charges: [[2, 0.6], [3, -0.55], [1, -0.15]], hDonor: 3, hAcceptor: 2 },
          ),
          arrangement: { dx: CH },   // the O–H hydrogen right above the other molecule's O
          note: 'Ethanol has an O–H group. Its very δ+ hydrogen is attracted to a lone pair on the oxygen of the next molecule: a hydrogen bond, much stronger than the other intermolecular forces here.',
        },
      ],
    },
  ],

  temperature: { min: -200, max: 200, default: 25 },   // °C

  // First match wins; `stats` comes from IMFLabPage. Texts never give away
  // a boiling point, so predict mode isn't spoiled.
  annotations: [
    {
      id: 'gas',
      condition: (v, s) => s.state === 'gas',
      text: (v, s) => `At ${v.temperature} °C ${s.molecule.name.toLowerCase()} is a gas: its molecules move too fast for the intermolecular forces to hold them together. They only meet for a moment when they collide.`,
    },
    {
      id: 'solid',
      condition: (v, s) => s.state === 'solid',
      text: (v, s) => `At ${v.temperature} °C ${s.molecule.name.toLowerCase()} is a solid: the intermolecular forces hold the molecules in place, so they can only vibrate.`,
    },
    {
      id: 'molecule',
      condition: (v, s) => !!s.molecule.note,
      text: (v, s) => s.molecule.note,
    },
    {
      id: 'default',
      condition: 'always',
      text: 'Electrons never stay still. At any instant they can bunch up on one side of a molecule: a temporary dipole (δ− where they gather, δ+ where they thin out). Its δ− side pushes away the electrons of the neighbouring molecule, inducing a dipole whose δ+ side faces it, and δ+ attracts δ−. These are London (dispersion) forces.',
    },
  ],
}
