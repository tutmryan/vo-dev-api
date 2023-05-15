import DataLoader from 'dataloader'
import { In } from 'typeorm'
import { dataSource } from '../../data'
import { UserEntity } from './entities/user-entity'

export const userLoader = () =>
  new DataLoader<string, UserEntity>(async (ids) => {
    const results = await dataSource
      .getRepository(UserEntity)
      .find({ comment: 'FindUsersById', where: { id: In(ids.map((id) => id.toUpperCase())) } })
    return ids.map((id) => results.find((result) => result.id.toUpperCase() === id.toUpperCase()) ?? new Error(`User not found: ${id}`))
  })
