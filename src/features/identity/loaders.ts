import DataLoader from 'dataloader'
import { In } from 'typeorm'
import { dataSource } from '../../data'
import { IdentityEntity } from './entities/identity-entity'

export const identityLoader = () =>
  new DataLoader<string, IdentityEntity>(async (ids) => {
    const results = await dataSource.getRepository(IdentityEntity).findBy({ id: In(ids.map((id) => id.toUpperCase())) })
    return ids.map((id) => results.find((result) => result.id.toUpperCase() === id.toUpperCase()) ?? new Error(`Identity not found: ${id}`))
  })
