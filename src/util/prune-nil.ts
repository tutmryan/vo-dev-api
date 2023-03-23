import { cloneDeep, forOwn, isNil, isObject } from 'lodash'

// https://stackoverflow.com/questions/18515254/recursively-remove-null-values-from-javascript-object

/**
 * Recursively removes all null and undefined values from an object
 */
export function pruneNil(obj: any) {
  return (function prune(current) {
    forOwn(current, function (value, key) {
      if (isNil(value) || (isObject(value) && isNil(prune(value)))) delete current[key]
    })
    return current
  })(cloneDeep(obj))
}
