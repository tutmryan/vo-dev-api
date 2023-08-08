import DataLoader from 'dataloader'
import { In } from 'typeorm'
import { dataSource } from '../../data'
import { IssuanceEntity } from './entities/issuance-entity'

export const issuanceLoader = () =>
  new DataLoader<string, IssuanceEntity>(async (ids) => {
    const results = await dataSource.getRepository(IssuanceEntity).find({ comment: 'FindIssuancesById', where: { id: In(ids) } })
    return ids.map((id) => results.find((result) => result.id.toUpperCase() === id.toUpperCase()) ?? new Error(`Issuance not found: ${id}`))
  })
