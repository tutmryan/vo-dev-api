import DataLoader from 'dataloader'
import { In } from 'typeorm'
import { dataSource } from '../../data'
import { TemplateEntity } from './entities/template-entity'

export const templateLoader = () =>
  new DataLoader<string, TemplateEntity>(async (ids) => {
    const results = await dataSource.getRepository(TemplateEntity).find({ comment: 'FindTemplatesById', where: { id: In(ids) } })
    return ids.map((id) => results.find((result) => result.id === id) ?? new Error(`Template not found: ${id}`))
  })
