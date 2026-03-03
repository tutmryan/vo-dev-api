import type { QueryContext } from '../../../cqs'
import { MicrosoftEntraTemporaryAccessPassIssuanceConfigurationEntity } from '../entities/microsoft-entra-temporary-access-pass-issuance-configuration-entity'

export async function GetMicrosoftEntraTemporaryAccessPassIssuanceConfigurationQuery(this: QueryContext, id: string) {
  return await this.entityManager.getRepository(MicrosoftEntraTemporaryAccessPassIssuanceConfigurationEntity).findOne({
    comment: 'GetMicrosoftEntraTemporaryAccessPassIssuanceConfiguration',
    where: { id },
  })
}
