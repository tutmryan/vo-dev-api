export const sortBy =
  <T, TKey>(keySelector: (item: T) => TKey, desc?: boolean) =>
  (a: T, b: T) => {
    const keyA = keySelector(a)
    const keyB = keySelector(b)
    return (desc ? -1 : 1) * (keyA < keyB ? -1 : keyA > keyB ? 1 : 0)
  }

export const sortByIgnoreCase =
  <T>(keySelector: (item: T) => string | null | undefined, desc?: boolean) =>
  (a: T, b: T) => {
    const keyA = keySelector(a)
    const keyB = keySelector(b)

    return (desc ? -1 : 1) * (keyA ?? '').localeCompare(keyB ?? '', undefined, { sensitivity: 'base' })
  }
