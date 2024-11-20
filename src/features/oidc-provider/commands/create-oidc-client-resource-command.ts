import { notifyOidcDataChanged } from '..'
import type { CommandContext } from '../../../cqs'
import type { OidcClientResourceInput } from '../../../generated/graphql'
import { invariant } from '../../../util/invariant'
import { OidcClientEntity } from '../entities/oidc-client-entity'
import { OidcClientResourceEntity } from '../entities/oidc-client-resource-entity'
import { OidcResourceEntity } from '../entities/oidc-resource-entity'
import { systemClientInvariant } from './utils'

export async function CreateOidcClientResourceCommand(
  this: CommandContext,
  clientId: string,
  { resourceId, resourceScopes }: OidcClientResourceInput,
) {
  systemClientInvariant(clientId)

  // check for duplicate client resource
  const existing = await this.entityManager.getRepository(OidcClientResourceEntity).countBy({ clientId, resourceId })
  invariant(existing === 0, `Client ${clientId} already has resource ${resourceId}`)

  // validate the client resource is valid and has valid scopes
  const resource = await this.entityManager.getRepository(OidcResourceEntity).findOneBy({ id: resourceId })
  invariant(resource, `Resource ${resourceId} not found`)
  invariant(resourceScopes.length > 0, 'Resource scopes must not be empty')
  const invalidScopes = resourceScopes.filter((scope) => !resource.scopes.includes(scope))
  invariant(invalidScopes.length === 0, `Invalid resource scopes: ${invalidScopes.join(', ')}`)

  await this.entityManager.getRepository(OidcClientResourceEntity).save(
    new OidcClientResourceEntity({
      clientId,
      resourceId,
      resourceScopes,
    }),
  )
  const updated = await this.entityManager.getRepository(OidcClientEntity).findOneByOrFail({ id: clientId })

  notifyOidcDataChanged()
  return updated
}
