export function invariant(condition: any, message: string): asserts condition {
  if (condition) return
  throw new InvariantError(message)
}

export class InvariantError extends Error {}
