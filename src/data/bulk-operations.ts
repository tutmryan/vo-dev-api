import type { ObjectLiteral } from 'typeorm/common/ObjectLiteral'
import type { FindOptionsWhere } from 'typeorm/find-options/FindOptionsWhere'
import type { VerifiedOrchestrationRepository } from './entity-manager'
import { In } from 'typeorm'

// This controls the number of records that are inserted in a single batch
export const DEFAULT_INSERT_BATCH_SIZE = 250

// Note:
//    1. `additionalData` is how the `EntityManager.save()` method is able to pass data to listeners/subscribers, but the other non-save
//        methods don't have support for this. So mimic the `queryRunner.data = this.options.data` from the TypeORM source code.
//    2. The `EntityManager.save()` method supports batching, but we don't want to check if the data is already saved, as we know it isn't.
//       Meaning the additional check for whether the entities exist in the database is not needed.
export async function batchInsert<T extends ObjectLiteral>(
  data: Partial<T>[],
  repo: VerifiedOrchestrationRepository<T>,
  batchSize: number,
  additionalData?: object,
) {
  const chunks = Array.from({ length: Math.ceil(data.length / batchSize) }, (_, i) => data.slice(i * batchSize, (i + 1) * batchSize))
  for (const chunk of chunks) {
    await repo.insert(
      chunk.map((c) => {
        if (additionalData) Object.assign(c, additionalData)
        return c
      }),
    )
  }
}

const DB_MAX_PARAMETERS = 2000 // The max is 2100, but we want to err on the side of caution

export async function bulkFindBy<T extends ObjectLiteral, TK extends keyof T>(
  repo: VerifiedOrchestrationRepository<T>,
  key: TK,
  values: Array<T[TK]>,
  comment?: string,
) {
  const chunks = Array.from({ length: Math.ceil(values.length / DB_MAX_PARAMETERS) }, (_, i) =>
    values.slice(i * DB_MAX_PARAMETERS, (i + 1) * DB_MAX_PARAMETERS),
  )
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
  const chunks = Array.from({ length: Math.ceil(values.length / dbMaxParameters) }, (_, i) =>
    values.slice(i * dbMaxParameters, (i + 1) * dbMaxParameters),
  )
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
