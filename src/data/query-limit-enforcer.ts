import type { FindManyOptions, ObjectLiteral, Repository, SelectQueryBuilder } from 'typeorm'
import { applySafeLimit } from '../util/typeorm'

/**
 * Wraps a TypeORM Repository via Proxy to automatically enforce safe query limits.
 * Intercepts .find(), .findAndCount(), and .createQueryBuilder() to ensure all queries have a limit.
 * Applies DEFAULT_QUERY_LIMIT (100) when no limit is specified, and throws an error when limits exceed MAX_QUERY_LIMIT (1000).
 */
function wrapQueryBuilderWithSafeLimits<QB extends SelectQueryBuilder<any>>(qb: QB): QB {
  const proxy = new Proxy(qb, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver) as unknown
      if (typeof value !== 'function') return value

      if (prop === 'take' || prop === 'limit') {
        return (requestedLimit: number) => {
          const safeLimit = applySafeLimit(requestedLimit)
          const result = (value as (...args: any[]) => any).call(target, safeLimit)
          return result === target ? proxy : result
        }
      }

      return (...args: any[]) => {
        const result = (value as (...args: any[]) => any).apply(target, args)
        return result === target ? proxy : result
      }
    },
  }) as QB

  return proxy
}

export function wrapRepositoryWithSafeLimits<Entity extends ObjectLiteral>(repository: Repository<Entity>): Repository<Entity> {
  return new Proxy(repository, {
    get(target, prop, receiver) {
      if (prop === 'find') {
        const originalFind = target.find.bind(target)
        return async (options?: FindManyOptions<Entity>) => {
          const safeTake = applySafeLimit(options?.take)
          return await originalFind({ ...options, take: safeTake })
        }
      }

      if (prop === 'findAndCount') {
        const originalFindAndCount = target.findAndCount.bind(target)
        return async (options?: FindManyOptions<Entity>) => {
          const safeTake = applySafeLimit(options?.take)
          return await originalFindAndCount({ ...options, take: safeTake })
        }
      }

      if (prop === 'createQueryBuilder') {
        const originalCreateQueryBuilder = target.createQueryBuilder.bind(target)
        return (...args: any[]) => {
          const qb = originalCreateQueryBuilder(...args) as SelectQueryBuilder<Entity>
          return wrapQueryBuilderWithSafeLimits(qb)
        }
      }

      const value = Reflect.get(target, prop, receiver) as unknown
      if (typeof value === 'function') return (value as (...args: any[]) => any).bind(target)
      return value
    },
  }) as Repository<Entity>
}
