// Safe localStorage wrapper with error handling
// Handles: localStorage disabled, storage full, JSON parse errors

export function isStorageAvailable() {
  try {
    const test = '__chemsim_test__'
    localStorage.setItem(test, '1')
    localStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}

export function getItem(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(key)
    if (item === null) return defaultValue
    return JSON.parse(item)
  } catch {
    return defaultValue
  }
}

export function setItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (e) {
    console.warn('ChemSim: localStorage write failed', e.message)
    return false
  }
}

export function removeItem(key) {
  try {
    localStorage.removeItem(key)
    return true
  } catch {
    return false
  }
}
