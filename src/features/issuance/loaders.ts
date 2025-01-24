import DataLoader from 'dataloader'
import { In } from 'typeorm'
import { dataSource } from '../../data'
import { compareIgnoreCase } from '../../util/string'
import { IssuanceEntity } from './entities/issuance-entity'

export const issuanceLoader = () =>
  new DataLoader<string, IssuanceEntity>(async (ids) => {
    const results = await dataSource.getRepository(IssuanceEntity).find({ comment: 'FindIssuancesById', where: { id: In(ids) } })
    return ids.map((id) => results.find((result) => result.id === id) ?? new Error(`Issuance not found: ${id}`))
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
      .comment('CountIssuancesByIdentityQuery')
      .getRawMany()

    return ids.map((id) => results.find((result) => compareIgnoreCase(result.identity_id, id))?.count ?? 0)
  })

export const issuanceCountByContractLoader = () =>
  new DataLoader<string, number>(async (ids) => {
    const results: { contract_id: string; count: number }[] = await dataSource
      .getRepository(IssuanceEntity)
      .createQueryBuilder('i')
      .select('COUNT(*)', 'count')
      .addSelect('i.contract_id')
      .where('i.contract_id IN (:...contractIds)', { contractIds: ids })
      .groupBy('i.contract_id')
      .comment('CountIssuancesByContractQuery')
      .getRawMany()

    return ids.map((id) => results.find((result) => compareIgnoreCase(result.contract_id, id))?.count ?? 0)
  })
