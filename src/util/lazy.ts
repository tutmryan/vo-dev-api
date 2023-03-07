const NoValue = Symbol('no-value')

type LazyInstance<T> = () => T
export const Lazy = <T>(factory: () => T): LazyInstance<T> => {
  let val: T | typeof NoValue = NoValue

  return () => {
    if (val === NoValue) {
      val = factory()
    }
    return val
  }
}
