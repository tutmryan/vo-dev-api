import type { CommandLike, QueryLike, TransactionalCommandLike } from '../cqs/dispatcher'

type Func = CommandLike | TransactionalCommandLike | QueryLike

const featurePattern = /\/features\/([^/]+)\//
const featureCache = new Map<Func, string | undefined>()

export const resolveFeature = (command: Func): string | undefined => {
  if (featureCache.has(command)) return featureCache.get(command)

  for (const mod of Object.values(require.cache)) {
    if (!mod?.filename || !featurePattern.test(mod.filename)) continue
    if (mod.exports && typeof mod.exports === 'object' && Object.values(mod.exports).includes(command)) {
      const match = mod.filename.match(featurePattern)
      const feature = match?.[1]
      featureCache.set(command, feature)
      return feature
    }
  }

  featureCache.set(command, undefined)

  return undefined
}
