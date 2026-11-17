// Maxwell–Boltzmann Distribution: a sample of gas particles whose kinetic
// energies are spread out, and the same particles sorted by energy into the
// Maxwell–Boltzmann graph, one dot per particle (page: 'mb-lab', see
// src/components/mblab/). Chemistry: src/engine/maxwellBoltzmann.js.
//
// Activation energies here are lower than in most real reactions
// (50–100 kJ mol⁻¹), where only about one particle in a billion has enough
// energy at room temperature: far too few to see in a sample of 200.

const fmt = (x) => (x >= 10 ? x.toFixed(0) : x.toFixed(1))

export const maxwellBoltzmannScenario = {
  id: 'maxwell-boltzmann',
  yearGroups: ['MYP5', 'DP1'],
  syllabusRef: 'R2.2',
  name: 'Maxwell–Boltzmann Distribution',
  subtitle: 'How the energies of particles are spread out',
  description: 'Watch a sample of gas particles and see each one as a dot on the Maxwell–Boltzmann graph. Change the temperature and activation energy, add a catalyst, and follow single particles as collisions change their energy.',

  guidingQuestion: 'The particles in a gas do not all have the same energy. How are their energies spread out, and why does a small rise in temperature make a reaction so much faster?',
  assignmentGoal: 'Click a few particles and find them on the graph. Keep the curve, raise the temperature and explain how the curve changes and why more particles have enough energy to react. Then switch on the catalyst: what changes, and what stays the same?',

  page: 'mb-lab',

  particles: 200,
  temperature: { min: 200, max: 800, step: 10, default: 300 },          // K
  activationEnergy: { min: 2, max: 25, step: 0.5, default: 10 },        // kJ mol⁻¹
  catalystFactor: 0.6,                                                  // Ea with catalyst = 0.6 × Ea
  graph: { maxEnergy: 30, binWidth: 0.4, maxCount: 32 },                // kJ mol⁻¹, kJ mol⁻¹ per column, dots

  // First match wins; `stats` comes from MBLabPage
  annotations: [
    {
      id: 'compare',
      condition: (v, s) => s.reference != null && s.reference !== v.temperature,
      text: (v, s) => {
        const hotter = v.temperature > s.reference
        const change = hotter
          ? `the curve is lower and wider and its peak has moved to higher energy`
          : `the curve is taller and narrower and its peak has moved to lower energy`
        const ratio = hotter ? s.fraction / s.referenceFraction : s.referenceFraction / s.fraction
        return `Compared with ${s.reference} K (dashed curve), ${change}. The area under it has not changed: it is still the same ${s.n} particles. ` +
          `But ${hotter ? 'much more' : 'much less'} of that area lies to the right of Ea: ${hotter ? '' : 'at ' + s.reference + ' K '}about ${fmt(ratio)} times as many particles have enough energy to react${hotter ? '' : ' as now'}. ` +
          `A small change in temperature makes a big change to the rate.`
      },
    },
    {
      id: 'catalyst',
      condition: (v) => v.catalyst,
      text: 'The catalyst does not give the particles more energy: the curve and the dots are exactly the same. It provides a different pathway with a lower activation energy, so more of the same particles have enough energy to react (the teal triangles as well as the orange diamonds).',
    },
    {
      id: 'default',
      condition: 'always',
      text: 'Each dot on the graph is one particle from the box above, stacked in the column for its kinetic energy: the taller the column, the more particles have that energy. Most particles have a moderate energy, a few are very fast (the long tail to the right), and none has zero energy. Only the particles to the right of Ea have enough energy to react when they collide. Click a particle to follow it.',
    },
  ],
}
