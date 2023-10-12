import { cloneDeep, forOwn, isObject } from 'lodash'

/**
 * Recursively removes values from an object having the specified keys
 */
export function pruneKeys(obj: any, ...keys: string[]) {
  return (function prune(current) {
    forOwn(current, function (value, key) {
      if (keys.includes(key)) delete current[key]
      else if (isObject(value)) prune(value)
    })
    return current
  })(cloneDeep(obj))
}
