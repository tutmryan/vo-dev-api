import DataLoader from 'dataloader'
import { In } from 'typeorm'
import { dataSource } from '../../data'
import { ContractEntity } from './entities/contract-entity'

export const contractLoader = () =>
  new DataLoader<string, ContractEntity>(async (ids) => {
    const results = await dataSource.getRepository(ContractEntity).find({ comment: 'FindContractsById', where: { id: In(ids) } })
    return ids.map((id) => results.find((result) => result.id === id) ?? new Error(`Contract not found: ${id}`))
  })
