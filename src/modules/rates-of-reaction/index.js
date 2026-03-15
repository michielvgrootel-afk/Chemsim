// Rates of Reaction module - Phase 1
// Contains 4 sub-reactions: General A+B->C, Aspirin Hydrolysis, Fermentation, Haber Process

import { generalReaction } from './reactions/general'
import { aspirinReaction } from './reactions/aspirin'
import { fermentationReaction } from './reactions/fermentation'
import { haberReaction } from './reactions/haber'
import { quizzes } from './quiz'

export const ratesOfReaction = {
  id: 'rates-of-reaction',
  name: 'Rates of Reaction',
  level: 'MYP5',
  description: 'Explore how temperature, concentration, and catalysts affect the speed of chemical reactions.',

  reactions: [generalReaction, aspirinReaction, fermentationReaction, haberReaction],

  quizzes,

  getReaction(reactionId) {
    return this.reactions.find(r => r.id === reactionId) || this.reactions[0]
  },

  getQuiz(reactionId) {
    return this.quizzes[reactionId] || null
  },
}
