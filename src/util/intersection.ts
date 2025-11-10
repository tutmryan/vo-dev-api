import { intersection, isEqual, isNil } from 'lodash'

const flatten = (
  data: Record<string, any>,
  { removeNull, removePrivate }: { removeNull: boolean; removePrivate: boolean } = { removeNull: false, removePrivate: false },
): Record<string, any> =>
  Object.entries(data).reduce<Record<string, any>>((acc, [key, val]) => {
    const remove = (removeNull && val === null) || (removePrivate && key.startsWith('_'))
    if (remove) return acc
    if (val instanceof URL) {
      acc[key] = val.toString()
      return acc
    }
    if (typeof val != 'object' || val === null) {
      acc[key] = val
      return acc
    }
    Object.entries(flatten(val)).forEach(([entryKey, entryVal]) => {
      const ignoreEntry = (removeNull && entryVal === null) || (removePrivate && entryKey.startsWith('_'))
      if (!ignoreEntry) acc[`${key}.${entryKey}`] = entryVal
    })
    return acc
  }, {})

export function findKeysIntersection(
  a: Record<string, any>,
  b: Record<string, any>,
  { ignoreNulls, ignorePrivate }: { ignoreNulls?: boolean; ignorePrivate?: boolean } = {},
): string[] {
  const flattenOpts = { removeNull: !!ignoreNulls, removePrivate: !!ignorePrivate }
  const [flatA, flatB] = [flatten(a, flattenOpts), flatten(b, flattenOpts)]
  const [keysA, keysB] = [Object.keys(flatA), Object.keys(flatB)]
  return intersection(keysA, keysB)
}

export function findKeysOverriding(
  a: Record<string, any>,
  b: Record<string, any>,
  { ignoreNulls, ignorePrivate }: { ignoreNulls?: boolean; ignorePrivate?: boolean } = {},
) {
  const flattenOpts = { removeNull: !!ignoreNulls, removePrivate: !!ignorePrivate }
  let [flatA, flatB] = [flatten(a, flattenOpts), flatten(b, flattenOpts)]
  flatA = normalizeColors(flatA)
  flatB = normalizeColors(flatB)

  const overriddenKeys: string[] = []
  for (const property in flatA) {
    const aValue = flatA[property]
    const bValue = flatB[property]

    if (!isNil(bValue) && !isEqual(aValue, bValue)) {
      overriddenKeys.push(property)
    }
  }

  return overriddenKeys
}

const COLOR_KEYS = ['display.card.backgroundColor', 'display.card.textColor']

function normalizeColors(obj: Record<string, any>) {
  for (const key of COLOR_KEYS) {
    if (typeof obj[key] === 'string') {
      obj[key] = obj[key].toLowerCase()
    }
  }
  return obj
}
