import { throwError } from './throw-error'
import { DomainError } from './domain-error'

export const mapResults = <TId, TEntity, TResult>(
  ids: readonly TId[],
  entities: TEntity[],
  matchOn: (x: TEntity) => TId,
  resultSelector: (x: TEntity) => TResult,
): TResult[] => {
  return ids.map((id) => {
    const match = entities.find((e) => matchOn(e) === id) ?? throwError(new DomainError('Match not found'))
    return resultSelector(match)
  })
}
