// Solubility Module — "Like Dissolves Like"
// Teaches why some substances dissolve in some solvents and not others

import { naclWaterScenario } from './reactions/nacl-water'
import { oilWaterScenario } from './reactions/oil-water'
import { solubilityQuizzes } from './quiz'

const reactions = [
  naclWaterScenario,
  oilWaterScenario,
]

export const solubility = {
  id: 'solubility',
  name: 'Solubility',
  level: 'MYP5',
  description: 'Explore why some substances dissolve in some solvents and not others. Learn the principle of "like dissolves like" through interactive simulations.',

  reactions,

  getReaction(reactionId) {
    return reactions.find(r => r.id === reactionId) || reactions[0]
  },

  getQuiz(reactionId) {
    return solubilityQuizzes[reactionId] || null
  },
}
