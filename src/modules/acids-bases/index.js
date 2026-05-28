// Acids, Bases & Buffers Module
// Four scenarios covering MYP5 → DP Topic 8 acid-base chemistry:
//   A. Strong vs Weak acid dissociation
//   B. Neutralisation with universal indicator
//   C. Buffer demonstration
//   D. pH scale sandbox

import { strongVsWeakScenario } from './reactions/strong-vs-weak'
import { neutralizationScenario } from './reactions/neutralization'
import { bufferScenario } from './reactions/buffer'
import { phScaleScenario } from './reactions/ph-scale'
import { acidsBasesQuizzes } from './quiz'

// Pedagogical order: students first see what dissociation looks like,
// then how acid + base neutralise, then how buffers resist change,
// then a sandbox to explore the full pH range.
const reactions = [
  strongVsWeakScenario,
  neutralizationScenario,
  bufferScenario,
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
