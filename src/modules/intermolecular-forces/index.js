// Intermolecular Forces module — London dispersion forces, and how they
// compare with dipole–dipole forces and hydrogen bonds (IB S2.2)

import { londonDispersionScenario } from './reactions/london-dispersion'
import { imfQuizzes } from './quiz'

const reactions = [londonDispersionScenario]

export const intermolecularForces = {
  id: 'intermolecular-forces',
  name: 'Intermolecular Forces',
  level: 'MYP4–5 / DP1',
  description: 'Why molecules attract each other: temporary and induced dipoles, London (dispersion) forces, and how they decide boiling points.',

  reactions,

  getReaction(reactionId) {
    return reactions.find(r => r.id === reactionId) || reactions[0]
  },

  getQuiz(reactionId) {
    return imfQuizzes[reactionId] || null
  },
}
