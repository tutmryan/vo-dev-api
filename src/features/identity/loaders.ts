import DataLoader from 'dataloader'
import { In } from 'typeorm'
import { dataSource } from '../../data'
import { IdentityEntity } from './entities/identity-entity'

export const identityLoader = () =>
  new DataLoader<string, IdentityEntity>(async (ids) => {
    const results = await dataSource
      .getRepository(IdentityEntity)
      .find({ comment: 'FindIdentitiesById', where: { id: In(ids.map((id) => id)) } })
    return ids.map((id) => results.find((result) => result.id === id) ?? new Error(`Identity not found: ${id}`))
  })

export const isIdentityDeletableLoader = () =>
  new DataLoader<string, boolean>(async (ids) => {
    // Handle empty input array to avoid empty IN clause
    if (ids.length === 0) {
      return []
    }

    const results = await dataSource
      .getRepository(IdentityEntity)
      .createQueryBuilder('i')
      .select('LOWER(i.id) AS id')
      // Use CASE WHEN EXISTS for boolean-like results (0 or 1)
      .addSelect(
        `CASE WHEN EXISTS (
              SELECT 1 FROM issuance iss WHERE iss.identity_id = i.id
           ) THEN 1 ELSE 0 END`,
        'hasIssuances',
      )
      .addSelect(
        `CASE WHEN EXISTS (
              SELECT 1 FROM async_issuance async_iss WHERE async_iss.identity_id = i.id
           ) THEN 1 ELSE 0 END`,
        'hasAsyncIssuances',
      )
      .addSelect(
        `CASE WHEN EXISTS (
              SELECT 1 FROM presentation p WHERE p.identity_id = i.id
           ) THEN 1 ELSE 0 END`,
        'hasPresentations',
      )
      .where('i.id IN (:...identityIds)', { identityIds: ids })
      .getRawMany<{ id: string; hasIssuances: 0 | 1; hasAsyncIssuances: 0 | 1; hasPresentations: 0 | 1 }>()

    return ids.map((id) => {
      const result = results.find((res) => res.id === id)

      if (!result) {
        return new Error(`Identity not found: ${id}`)
      }

      // Determine deletability based on the CASE results (0 means no related records)
      // Note: Raw results might be strings or numbers. Explicitly check against 0.
      const isDeletable =
        Number(result.hasIssuances) === 0 && Number(result.hasAsyncIssuances) === 0 && Number(result.hasPresentations) === 0
      return isDeletable
    })
  })
