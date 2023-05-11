export function compactErrors<T>(values: Array<T | Error>): T[] {
  return values.filter((v) => !(v instanceof Error)) as T[]
}
