// pH Scale Sandbox — a graph-first pH lab rather than a particle simulation
// (page: 'ph-lab', see src/components/phlab/). Students add strong or weak
// acids and bases, dilute with water, pour some out or evaporate it, and run
// titrations. The pH is calculated exactly from the concentrations (charge
// balance with Ka, Kb and Kw, src/engine/phLab.js), so dilution,
// neutralisation and buffers behave as they would in a real lab.

// Which side of a titration is weak decides the pH at equivalence
function equivalenceKind({ analyte, titrant }) {
  const weakAcid = [analyte, titrant].some(s => s.type === 'acid' && !s.strong)
  const weakBase = [analyte, titrant].some(s => s.type === 'base' && !s.strong)
  if (weakAcid && weakBase) return 'both-weak'
  if (weakAcid) return 'basic'
  if (weakBase) return 'acidic'
  return 'neutral'
}

const atEquivalence = (kind) => (vars, s) => s.mode === 'titration' && s.passedEq && equivalenceKind(s) === kind

export const phScaleScenario = {
  id: 'ph-scale',
  yearGroups: ['MYP5', 'DP2'],
  syllabusRef: 'R3.1.4',
  name: 'pH Scale Sandbox',
  subtitle: 'Mix, dilute and titrate — read the pH graph',
  description: 'A virtual pH lab. Add strong or weak acids and bases, dilute with water, pour some out or evaporate it, and run titrations with a burette and indicators. The graph shows exactly how the pH responds.',

  guidingQuestion: 'How do concentration, dilution and the strength of an acid or base decide the pH — and why does the pH change so suddenly near the end of a titration?',
  assignmentGoal: 'Dilute a strong acid and a weak acid ten times and compare how far each pH moves. Then titrate ethanoic acid with sodium hydroxide, find the equivalence point and choose a suitable indicator.',

  page: 'ph-lab',

  // Monoprotic acids and bases with IB data-booklet strengths
  substances: [
    { id: 'HCl', formula: 'HCl', name: 'hydrochloric acid', type: 'acid', strong: true, ion: 'Cl⁻', color: '#e05555' },
    { id: 'CH3COOH', formula: 'CH₃COOH', name: 'ethanoic acid', type: 'acid', strong: false, pKa: 4.76, ion: 'CH₃COO⁻', color: '#f0913a' },
    { id: 'NaOH', formula: 'NaOH', name: 'sodium hydroxide', type: 'base', strong: true, ion: 'Na⁺', color: '#4f9cf0' },
    { id: 'NH3', formula: 'NH₃', name: 'ammonia', type: 'base', strong: false, pKb: 4.75, ion: 'NH₄⁺', color: '#9b6ef0' },
  ],
  concentrations: [0.001, 0.01, 0.1, 1],   // mol dm⁻³ of the solutions students add
  addAmounts: [0.05, 1, 10, 25],           // cm³ per click (0.05 cm³ = one drop)
  removeAmounts: [10, 25],                 // cm³ per click for pour out / evaporate
  pourRate: 5,                             // cm³ s⁻¹ while "hold to pour" is held
  beaker: { capacity: 250, startVolume: 50, minVolume: 5 },   // cm³

  titration: {
    analyte: { substance: 'CH3COOH', conc: 0.1, volume: 25 },   // in the flask
    titrant: { substance: 'NaOH', conc: 0.1 },                  // in the burette
    analyteVolumes: [10, 20, 25, 50],      // cm³
    tapRates: { slow: 0.1, fast: 1 },      // cm³ s⁻¹
    stepVolume: 1,                         // cm³ per "+1.00 cm³" click
    rowEvery: 1,                           // cm³ of titrant between data-table rows
  },

  // Colour-change ranges from the IB data booklet
  indicators: [
    { id: 'universal', name: 'Universal indicator' },
    { id: 'methyl-orange', name: 'Methyl orange', low: 3.1, high: 4.4, acidColor: '#e0473c', baseColor: '#f2c94c' },
    { id: 'methyl-red', name: 'Methyl red', low: 4.4, high: 6.2, acidColor: '#e0473c', baseColor: '#f2c94c' },
    { id: 'bromothymol-blue', name: 'Bromothymol blue', low: 6.0, high: 7.6, acidColor: '#f2c94c', baseColor: '#2f6fd6' },
    { id: 'phenolphthalein', name: 'Phenolphthalein', low: 8.3, high: 10.0, acidColor: 'clear', baseColor: '#e0479e' },
  ],

  temperature: { min: 0, max: 100, default: 25 },   // °C — changes Kw

  // First match wins. `stats` comes from PHLabPage (pH, last action,
  // titration markers…); `text` may be a function of (vars, stats).
  annotations: [
    {
      id: 'eq-basic',
      condition: atEquivalence('basic'),
      text: (v, s) => `At the equivalence point the pH was ${s.eqPH.toFixed(2)}, above 7: all the weak acid had been turned into its conjugate base, which is weakly basic. Phenolphthalein (pH 8.3–10) changes colour in the steep part of the curve; methyl orange would change far too early.`,
    },
    {
      id: 'eq-acidic',
      condition: atEquivalence('acidic'),
      text: (v, s) => `At the equivalence point the pH was ${s.eqPH.toFixed(2)}, below 7: all the ammonia had been turned into NH₄⁺, which is weakly acidic. Methyl orange or methyl red change colour in the steep part; phenolphthalein (pH 8.3–10) changes well away from it.`,
    },
    {
      id: 'eq-neutral',
      condition: atEquivalence('neutral'),
      text: (v, s) => `Strong acid + strong base: at the equivalence point the flask holds only a salt (NaCl) and water, so the pH was ${s.eqPH.toFixed(2)}, neutral. The jump is so steep that methyl orange, bromothymol blue and phenolphthalein would all work.`,
    },
    {
      id: 'eq-both-weak',
      condition: atEquivalence('both-weak'),
      text: 'Weak acid + weak base: there is no steep jump at the equivalence point, so no indicator gives a sharp colour change. This titration is not done with an indicator.',
    },
    {
      id: 'half-equivalence',
      condition: (v, s) => s.mode === 'titration' && s.passedHalf,
      text: (v, s) => `Half-way to the equivalence point, half the ${s.analyte.formula} has been turned into ${s.analyte.ion}. With equal amounts of the two, pH = pKa${s.analyte.type === 'base' ? ' of NH₄⁺' : ''} = ${s.halfPH.toFixed(2)}. The flat stretch of the curve around here is a buffer region.`,
    },
    {
      id: 'temperature',
      condition: (v, s) => s.lastAction === 'temperature' && s.neutralPH != null,
      text: (v, s) => `At ${v.temperature} °C, Kw = ${s.KwText}, so neutral water has pH ${s.neutralPH.toFixed(2)}. That water is still neutral, because [H⁺] = [OH⁻]: "neutral means pH 7" is only true at 25 °C.`,
    },
    {
      id: 'titration-start',
      condition: (v, s) => s.mode === 'titration',
      text: 'Open the burette tap or add drops, and watch the pH. Near the equivalence point a single drop can change the pH by several units, so slow down there. Switch the x-axis to "Volume added" for the textbook pH curve.',
    },
    {
      id: 'poured-out',
      condition: (v, s) => s.lastAction === 'pourOut',
      text: 'Pouring some solution away doesn’t change the pH: what is left has the same concentration, there is just less of it.',
    },
    {
      id: 'evaporated-water',
      condition: (v, s) => s.lastAction === 'evaporate' && !s.hasAcid && !s.hasBase,
      text: 'Evaporating pure water changes nothing: there is no acid or base to concentrate, so it stays neutral.',
    },
    {
      id: 'evaporated',
      condition: (v, s) => s.lastAction === 'evaporate',
      text: 'Evaporating water leaves the same amount of acid or base in less water. The solution is more concentrated, so the pH moves further from 7.',
    },
    {
      id: 'diluted-water',
      condition: (v, s) => s.lastAction === 'water' && !s.hasAcid && !s.hasBase,
      text: 'Adding water to water: still neutral. Add an acid or a base first, then dilute it.',
    },
    {
      id: 'diluted',
      condition: (v, s) => s.lastAction === 'water',
      text: 'Adding water dilutes the solution, so the pH moves towards 7 but never past it. Diluting a strong acid 10 times raises its pH by 1; a weak acid by only about 0.5. Try both!',
    },
    {
      id: 'neutralising',
      condition: (v, s) => s.lastAction === 'add' && s.hasAcid && s.hasBase,
      text: 'Acid and base neutralise each other (H⁺ + OH⁻ → H₂O). The pH changes slowly at first, then very suddenly when they are almost exactly balanced. Switch the x-axis to "Volume added" to see the curve.',
    },
    {
      id: 'strong-vs-weak',
      condition: (v, s) => s.lastAction === 'add',
      text: 'Strong or weak? 0.1 mol dm⁻³ HCl has pH 1.0, but 0.1 mol dm⁻³ CH₃COOH only about 2.9, because only about 1 % of it ionises. Use "Keep run & start new" to compare them on one graph.',
    },
    {
      id: 'default',
      condition: 'always',
      text: 'Add acids, bases or water and watch the pH graph: the clock starts with your first step. Can you make the beaker every colour of the universal indicator? How far does the pH move when you dilute an acid 10 times?',
    },
  ],
}
