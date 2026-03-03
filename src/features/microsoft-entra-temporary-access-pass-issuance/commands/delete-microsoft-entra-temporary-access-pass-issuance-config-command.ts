import type { CommandContext } from '../../../cqs'
import { MicrosoftEntraTemporaryAccessPassIssuanceConfigurationEntity } from '../entities/microsoft-entra-temporary-access-pass-issuance-configuration-entity'

export async function DeleteMicrosoftEntraTemporaryAccessPassIssuanceConfigurationCommand(this: CommandContext, id: string) {
  const result = await this.entityManager.getRepository(MicrosoftEntraTemporaryAccessPassIssuanceConfigurationEntity).delete(id)
  return (result.affected ?? 0) > 0
}
