import type { CommandContext } from '../../../cqs'
import type { OidcClientVcPolicyInput } from '../../../generated/graphql'
import { OidcClientEntity } from '../entities/oidc-client-entity'
import { notifyOidcDataChanged } from '../provider'

export async function UpdateOidcClientVcPolicyCommand(
  this: CommandContext,
  clientId: string,
  input: OidcClientVcPolicyInput,
): Promise<OidcClientEntity> {
  const repo = this.entityManager.getRepository(OidcClientEntity)
  const client = await repo.findOneByOrFail({ id: clientId })

  client.updateVcPolicy({
    vcType: input.vcType ?? undefined,
    vcConstraintValues: input.vcConstraintValues ?? undefined,
  })

  const updatedClient = await repo.save(client)
  notifyOidcDataChanged()
  return updatedClient
}
