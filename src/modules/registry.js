// Module Registry - the single config file that lists all available modules
// Adding a new simulation = create a new module file + add one line here

import { ratesOfReaction } from './rates-of-reaction/index'
import { solubility } from './solubility/index'
import { gases } from './gases/index'
import { acidsBases } from './acids-bases/index'

export const MODULE_REGISTRY = [
  ratesOfReaction,
  solubility,
  gases,
  acidsBases,
]

export function getModule(moduleId) {
  return MODULE_REGISTRY.find(m => m.id === moduleId) || MODULE_REGISTRY[0]
}

export function getAllModules() {
  return MODULE_REGISTRY
}

// Find a scenario by id across every module (exact match only).
export function findReaction(reactionId) {
  if (!reactionId) return null
  for (const module of MODULE_REGISTRY) {
    const reaction = module.reactions.find(r => r.id === reactionId)
    if (reaction) return { module, reaction }
  }
  return null
}

// The teacher's on/off list is one flat array of reaction ids across all
// modules. A module with none of its ids in the list (never configured, or
// added after the list was saved) shows all of its reactions.
export function getEnabledReactions(module, storedIds) {
  if (!Array.isArray(storedIds)) return module.reactions
  const enabled = module.reactions.filter(r => storedIds.includes(r.id))
  return enabled.length > 0 ? enabled : module.reactions
}
