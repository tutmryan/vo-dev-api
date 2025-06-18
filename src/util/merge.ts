import type { MergeWithCustomizer } from 'lodash'
import { mergeWith } from 'lodash'

const mergeWithArraysCustomizer: MergeWithCustomizer = (objValue, srcValue) => {
  if (Array.isArray(objValue)) {
    return [...new Set([...objValue, ...srcValue])]
  }
  return
}

export function mergeWithArrays<TObject, TSource>(object: TObject, ...source: TSource[]): TObject & TSource {
  return mergeWith({}, object, ...source, mergeWithArraysCustomizer)
}
