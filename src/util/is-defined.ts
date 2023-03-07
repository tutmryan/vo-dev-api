export const isDefined = <T>(x: T): x is Exclude<T, undefined> => x !== undefined
