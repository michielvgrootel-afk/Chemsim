// Module Registry - the single config file that lists all available modules
// Adding a new simulation = create a new module file + add one line here

import { ratesOfReaction } from './rates-of-reaction/index'

export const MODULE_REGISTRY = [
  ratesOfReaction,
  // Phase 2: add new modules here
  // { id: 'equilibrium', ... },
  // { id: 'collision-theory', ... },
]

export function getModule(moduleId) {
  return MODULE_REGISTRY.find(m => m.id === moduleId) || MODULE_REGISTRY[0]
}

export function getAllModules() {
  return MODULE_REGISTRY
}
