import { useState, useCallback } from 'react'
import { getItem, setItem, isStorageAvailable } from '../utils/storage'

export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    return getItem(key, initialValue)
  })

  const setValue = useCallback((value) => {
    const valueToStore = value instanceof Function ? value(storedValue) : value
    setStoredValue(valueToStore)
    setItem(key, valueToStore)
  }, [key, storedValue])

  const available = isStorageAvailable()

  return [storedValue, setValue, available]
}
