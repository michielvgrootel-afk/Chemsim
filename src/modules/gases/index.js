// Gases Module — kinetic theory and the ideal gas laws (IB DP S1.5)

import { gasLawsScenario } from './reactions/gas-laws'
import { gasesQuizzes } from './quiz'

const reactions = [gasLawsScenario]

export const gases = {
  id: 'gases',
  name: 'Gases',
  level: 'DP1',
  description: 'See how pressure, volume, temperature and amount of gas are linked, and where real gases stop behaving ideally.',

  reactions,

  getReaction(reactionId) {
    return reactions.find(r => r.id === reactionId) || reactions[0]
  },

  getQuiz(reactionId) {
    return gasesQuizzes[reactionId] || null
  },
}
