import DataLoader from 'dataloader'
import { In } from 'typeorm'
import { dataSource } from '../../data'
import { PresentationFlowEntity } from './entities/presentation-flow-entity'
import { PresentationFlowTemplateEntity } from './entities/presentation-flow-template-entity'

export const presentationFlowLoader = () =>
  new DataLoader<string, PresentationFlowEntity>(async (ids) => {
    const results = await dataSource
      .getRepository(PresentationFlowEntity)
      .find({ comment: 'FindPresentationFlowById', where: { id: In(ids) } })
    return ids.map((id) => results.find((result) => result.id === id) ?? new Error(`Presentation flow not found: ${id}`))
  })

export const presentationFlowTemplateLoader = () =>
  new DataLoader<string, PresentationFlowTemplateEntity>(async (ids) => {
    const results = await dataSource
      .getRepository(PresentationFlowTemplateEntity)
      .find({ comment: 'FindPresentationFlowTemplateById', where: { id: In(ids) } })
    return ids.map((id) => results.find((result) => result.id === id) ?? new Error(`Template not found: ${id}`))
  })
