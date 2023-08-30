import DataLoader from 'dataloader'
import { In } from 'typeorm'
import { dataSource } from '../../data'
import { IssuanceEntity } from './entities/issuance-entity'

export const issuanceLoader = () =>
  new DataLoader<string, IssuanceEntity>(async (ids) => {
    const results = await dataSource.getRepository(IssuanceEntity).find({ comment: 'FindIssuancesById', where: { id: In(ids) } })
    return ids.map((id) => results.find((result) => result.id.toUpperCase() === id.toUpperCase()) ?? new Error(`Issuance not found: ${id}`))
  })

export const issuanceCountByIdentityLoader = () =>
  new DataLoader<string, number>(async (ids) => {
    const results: { identity_id: string; count: number }[] = await dataSource
      .getRepository(IssuanceEntity)
      .createQueryBuilder('i')
      .select('COUNT(*)', 'count')
      .addSelect('i.identity_id')
      .where('i.identity_id IN (:...identityIds)', { identityIds: ids })
      .groupBy('i.identity_id')
      .getRawMany()

    return ids.map((id) => results.find((result) => result.identity_id.toUpperCase() === id.toUpperCase())?.count ?? 0)
  })
