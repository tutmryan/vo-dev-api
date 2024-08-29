import DataLoader from 'dataloader'
import { In } from 'typeorm'
import { dataSource } from '../../data'
import { AsyncIssuanceEntity } from './entities/async-issuance-entity'

export const asyncIssuanceLoader = () =>
  new DataLoader<string, AsyncIssuanceEntity>(async (ids) => {
    const results = await dataSource.getRepository(AsyncIssuanceEntity).find({ comment: 'FindAsyncIssuancesById', where: { id: In(ids) } })
    return ids.map(
      (id) => results.find((result) => result.id.toUpperCase() === id.toUpperCase()) ?? new Error(`Async issuance not found: ${id}`),
    )
  })
