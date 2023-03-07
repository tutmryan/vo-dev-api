export const getCircularReplacer = () => {
  const seen = new WeakSet()
  return (_: string, value: any) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return
      }
      seen.add(value)
    }
    if (typeof value === 'bigint') return value.toString()
    return value
  }
}
