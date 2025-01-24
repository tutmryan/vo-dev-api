import DataLoader from 'dataloader'
import { In } from 'typeorm'
import { dataSource } from '../../data'
import { PresentationEntity } from './entities/presentation-entity'

export const presentationLoader = () =>
  new DataLoader<string, PresentationEntity>(async (ids) => {
    const results = await dataSource.getRepository(PresentationEntity).find({ comment: 'FindPresentationsById', where: { id: In(ids) } })
    return ids.map((id) => results.find((result) => result.id === id) ?? new Error(`Presentation not found: ${id}`))
  })
