import DataLoader from 'dataloader'
import { In } from 'typeorm'
import { dataSource } from '../../data'
import { IdentityStoreEntity } from './entities/identity-store-entity'

export const identityStoreLoader = () =>
  new DataLoader<string, IdentityStoreEntity>(async (ids) => {
    const results = await dataSource
      .getRepository(IdentityStoreEntity)
      .find({ comment: 'FindIdentityStoresById', where: { id: In(ids.map((id) => id)) }, withDeleted: true })
    return ids.map((id) => results.find((result) => result.id === id) ?? new Error(`Identity store not found: ${id}`))
  })
