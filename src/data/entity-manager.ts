import type { EntityManager } from 'typeorm'
import type { EntityTarget } from 'typeorm/common/EntityTarget'
import type { ObjectLiteral } from 'typeorm/common/ObjectLiteral'
import type { Repository } from 'typeorm/repository/Repository'
import { wrapRepositoryWithSafeLimits } from './query-limit-enforcer'
import type { VerifiedOrchestrationEntity } from './verified-orchestration-entity'

export type VerifiedOrchestrationEntityManager = {
  getRepository<Entity extends VerifiedOrchestrationEntity>(target: EntityTarget<Entity>): VerifiedOrchestrationRepository<Entity>
}

export type VerifiedOrchestrationRepository<T extends ObjectLiteral> = Omit<Repository<T>, 'create'>

/**
 * Wraps an EntityManager via Proxy to automatically enforce safe query limits on all repository operations.
 * Ensures all queries have a limit: applies MAX_QUERY_LIMIT (1000) when no limit is specified,
 * and caps excessive limits at MAX_QUERY_LIMIT to prevent unbounded queries and database overload.
 */
export function wrapEntityManagerWithSafeLimits<TEntityManager extends EntityManager | VerifiedOrchestrationEntityManager>(
  entityManager: TEntityManager,
): TEntityManager {
  // The VerifiedOrchestrationEntityManager type is just a limited interface,
  // but the actual value at runtime is always a full EntityManager
  const em = entityManager as EntityManager

  const proxied = new Proxy(em, {
    get(target, prop, receiver) {
      if (prop === 'getRepository') {
        const originalGetRepository = target.getRepository.bind(target)
        return <Entity extends ObjectLiteral>(entityTarget: EntityTarget<Entity>): Repository<Entity> => {
          const repository = originalGetRepository(entityTarget)
          return wrapRepositoryWithSafeLimits(repository) as Repository<Entity>
        }
      }

      const value = Reflect.get(target, prop, receiver) as unknown
      if (typeof value === 'function') return (value as (...args: any[]) => any).bind(target)
      return value
    },
  })

  return proxied as TEntityManager
}
