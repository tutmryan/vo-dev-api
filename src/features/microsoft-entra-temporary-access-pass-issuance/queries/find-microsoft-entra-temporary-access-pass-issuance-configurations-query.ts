import type { QueryContext } from '../../../cqs'
import { MicrosoftEntraTemporaryAccessPassIssuanceConfigurationEntity } from '../entities/microsoft-entra-temporary-access-pass-issuance-configuration-entity'

export async function FindMicrosoftEntraTemporaryAccessPassIssuanceConfigurationsQuery(this: QueryContext) {
  return await this.entityManager.getRepository(MicrosoftEntraTemporaryAccessPassIssuanceConfigurationEntity).find({
    comment: 'FindMicrosoftEntraTemporaryAccessPassIssuanceConfigurationsQuery',
    order: { title: 'ASC' },
  })
}
