import { notifyOidcDataChanged } from '..'
import type { CommandContext } from '../../../cqs'
import type { OidcResourceInput } from '../../../generated/graphql'
import { invariant } from '../../../util/invariant'
import { OidcResourceEntity } from '../entities/oidc-resource-entity'

export async function CreateOidcResourceCommand(this: CommandContext, input: OidcResourceInput) {
  invariant(input.scopes.length > 0, 'At least one scope is required')

  const resource = await this.entityManager.getRepository(OidcResourceEntity).save(
    new OidcResourceEntity({
      ...input,
    }),
  )

  notifyOidcDataChanged()
  return resource
}
