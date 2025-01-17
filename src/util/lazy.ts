import { logger } from '../logger'

const NoValue = Symbol('no-value')

type LazyInstance<T> = () => T
export const Lazy = <T>(factory: () => T): LazyInstance<T> => {
  let val: T | typeof NoValue = NoValue

  return () => {
    if (val === NoValue) {
      val = factory()
    }
    // evict promise values when they reject
    if (val instanceof Promise) {
      val.catch((error) => {
        logger.warn('Lazy promise rejected, evicting result', { error })
        val = NoValue
      })
    }
    return val
  }
}
