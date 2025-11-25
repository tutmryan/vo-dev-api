import { randomUUID } from 'crypto'
import { In, type InsertResult } from 'typeorm'
import type { EntityTarget } from 'typeorm/common/EntityTarget'
import type { ObjectLiteral } from 'typeorm/common/ObjectLiteral'
import type { FindOptionsWhere } from 'typeorm/find-options/FindOptionsWhere'
import type { AuditData, AuditOptimisationControl } from '../features/auditing/auditing-event-subscribers'
import { UserEntity } from '../features/users/entities/user-entity'
import { chunkify } from '../util/chunkify'
import { invariant } from '../util/invariant'
import type { VerifiedOrchestrationEntityManager, VerifiedOrchestrationRepository } from './entity-manager'
import type { VerifiedOrchestrationEntity } from './verified-orchestration-entity'

// This controls the number of records that are inserted in a single batch
const DEFAULT_INSERT_BATCH_SIZE = 250

// Note:
//    1. `additionalData` is how the `EntityManager.save()` method is able to pass data to listeners/subscribers, but the other non-save
//        methods don't have support for this. So mimic the `queryRunner.data = this.options.data` from the TypeORM source code.
//    2. The `EntityManager.save()` method supports batching, but we don't want to check if the data is already saved, as we know it isn't.
//       Meaning the additional check for whether the entities exist in the database is not needed.
async function doBatchInsert<T extends ObjectLiteral>(
  data: Partial<T>[],
  repo: VerifiedOrchestrationRepository<T>,
  batchSize: number,
  additionalData?: object,
  log?: (result: InsertResult) => void,
) {
  const chunks = chunkify(data, batchSize)
  for (const chunk of chunks) {
    const result = await repo.insert(additionalData ? chunk.map((c) => Object.assign(c, additionalData)) : chunk)
    log?.(result)
  }
}

export async function bulkInsert<
  T extends VerifiedOrchestrationEntity & ObjectLiteral,
  TA extends VerifiedOrchestrationEntity & ObjectLiteral,
>(
  data: Partial<T>[],
  entityTarget: EntityTarget<T>,
  manager: VerifiedOrchestrationEntityManager,
  options?: {
    entityAuditTarget?: EntityTarget<TA>
    batchSize?: number
    log?: (result: InsertResult) => void
  },
) {
  const { batchSize = DEFAULT_INSERT_BATCH_SIZE, entityAuditTarget } = options || {}
  const repo = manager.getRepository(entityTarget)
  const auditRepo = entityAuditTarget ? manager.getRepository(entityAuditTarget) : undefined
  const auditEntriesToSave: AuditData[] = []

  await doBatchInsert(
    data,
    repo,
    batchSize,
    auditRepo
      ? { handoffInsert: (auditData: AuditData) => auditEntriesToSave.push(auditData) }
      : (undefined satisfies AuditOptimisationControl | undefined),
    options?.log,
  )

  if (auditRepo) {
    invariant(auditEntriesToSave.length === data.length, 'Audit data was not saved correctly')
    if (auditEntriesToSave.length > 0) {
      const auditUser = await manager.getRepository(UserEntity).findOneByOrFail({
        id: auditEntriesToSave[0]!.userId,
      })
      const auditRecordsToSave = auditEntriesToSave.map(
        (auditData) =>
          ({
            id: randomUUID(),
            entityId: auditData.entityId,
            auditData: auditData.auditData,
            action: auditData.action,
            user: auditUser,
            auditDateTime: auditData.auditDateTime,
          }) as unknown as TA,
      )
      await doBatchInsert(auditRecordsToSave, auditRepo, batchSize)
    }
  }
}

const DB_MAX_PARAMETERS = 2000 // The max is 2100, but we want to err on the side of caution

export async function bulkFindBy<T extends ObjectLiteral, TK extends keyof T>(
  repo: VerifiedOrchestrationRepository<T>,
  key: TK,
  values: Array<T[TK]>,
  comment?: string,
) {
  const chunks = chunkify(values, DB_MAX_PARAMETERS)
  const results = await Promise.all(
    chunks.map((chunk) =>
      repo.find({
        where: { [key]: In(chunk) } as FindOptionsWhere<T>,
        comment,
      }),
    ),
  )
  return results.flat()
}

export async function bulkFindByTuple<T extends ObjectLiteral, TK extends keyof T>(
  repo: VerifiedOrchestrationRepository<T>,
  keys: [TK, TK],
  values: Array<[T[TK], T[TK]]>,
  comment?: string,
) {
  const dbMaxParameters = DB_MAX_PARAMETERS / 2 // 2 values per tuple
  const chunks = chunkify(values, dbMaxParameters)
  const results = await Promise.all(
    chunks.map((chunk) =>
      repo.find({
        where: chunk.map(([a, b]) => ({ [keys[0]]: a, [keys[1]]: b })) as FindOptionsWhere<T>[],
        comment,
      }),
    ),
  )
  return results.flat()
}
