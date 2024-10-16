export function chunkify<T>(data: T[], chunkSize: number): T[][] {
  return Array.from({ length: Math.ceil(data.length / chunkSize) }, (_, i) => data.slice(i * chunkSize, (i + 1) * chunkSize))
}
