export const asyncGeneratorToArray = async <T>(generator: AsyncGenerator<T, void, void>) => {
  const result = []
  for await (const item of generator) {
    result.push(item)
  }
  return result
}
