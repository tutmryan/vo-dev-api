import DataLoader from 'dataloader'
import { In } from 'typeorm'
import { entityManager } from '../../data'
import { MicrosoftEntraTemporaryAccessPassIssuanceEntity } from './entities/microsoft-entra-temporary-access-pass-issuance-entity'

export const microsoftEntraTemporaryAccessPassIssuanceLoader = () =>
  new DataLoader<string, MicrosoftEntraTemporaryAccessPassIssuanceEntity>(async (ids) => {
    const results = await entityManager
      .getRepository(MicrosoftEntraTemporaryAccessPassIssuanceEntity)
      .find({ comment: 'LoadMicrosoftEntraTemporaryAccessPassIssuances', where: { id: In(ids.map((id) => id)) } })
    return ids.map(
      (id) => results.find((result) => result.id === id) ?? new Error(`Microsoft Entra Temporary Access Pass Issuance not found: ${id}`),
    )
  })
