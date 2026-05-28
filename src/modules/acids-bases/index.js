// Acids, Bases & Buffers Module
// Four scenarios covering MYP5 → DP Topic 8 acid-base chemistry:
//   A. Strong vs Weak acid dissociation
//   B. Neutralisation with universal indicator
//   C. Buffer demonstration
//   D. pH scale sandbox

import { phScaleScenario } from './reactions/ph-scale'
import { acidsBasesQuizzes } from './quiz'

const reactions = [
  phScaleScenario,
]

export const acidsBases = {
  id: 'acids-bases',
  name: 'Acids & Bases',
  level: 'MYP5 / DP',
  description: 'Explore how acids and bases behave at the molecular level. See dissociation, neutralisation, buffers, and the pH scale come alive.',

  reactions,

  getReaction(reactionId) {
    return reactions.find(r => r.id === reactionId) || reactions[0]
  },

  getQuiz(reactionId) {
    return acidsBasesQuizzes[reactionId] || null
  },
}
