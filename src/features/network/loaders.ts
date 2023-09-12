import DataLoader from 'dataloader'
import { In } from 'typeorm'
import { dataSource } from '../../data'
import { PartnerEntity } from './entities/partner-entity'

export const partnerLoader = () =>
  new DataLoader<string, PartnerEntity>(async (ids) => {
    const results = await dataSource
      .getRepository(PartnerEntity)
      .find({ comment: 'FindPartnersById', where: { id: In(ids.map((id) => id.toUpperCase())) } })
    return ids.map((id) => results.find((result) => result.id.toUpperCase() === id.toUpperCase()) ?? new Error(`Partner not found: ${id}`))
  })
