import DataLoader from 'dataloader'
import { In } from 'typeorm'
import { entityManager } from '../../data'
import { PartnerEntity } from './entities/partner-entity'

export const partnerLoader = () =>
  new DataLoader<string, PartnerEntity>(async (ids) => {
    const results = await entityManager
      .getRepository(PartnerEntity)
      .find({ comment: 'FindPartnersById', where: { id: In(ids.map((id) => id)) }, withDeleted: true })
    return ids.map((id) => results.find((result) => result.id === id) ?? new Error(`Partner not found: ${id}`))
  })

export const presentationPartnersLoader = () =>
  new DataLoader<string, PartnerEntity[]>(async (presentationIds) => {
    const partners = await entityManager
      .getRepository(PartnerEntity)
      .find({ where: { presentations: { id: In(presentationIds) } }, withDeleted: true })
    return presentationIds.map((presentationId) => partners.filter((partner) => partner.presentationIds.includes(presentationId)))
  })

export const partnerByDidLoader = () =>
  new DataLoader<string, PartnerEntity | null>(async (dids) => {
    const results = await entityManager
      .getRepository(PartnerEntity)
      .find({ where: { didHash: In(dids.map((did) => PartnerEntity.createDidHash(did))) }, withDeleted: true })
    return dids.map((did) => results.find((result) => result.didHash === PartnerEntity.createDidHash(did)) ?? null)
  })
