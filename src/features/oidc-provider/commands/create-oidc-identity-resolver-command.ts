import type { CommandContext } from '../../../cqs'
import type { OidcIdentityResolverInput } from '../../../generated/graphql'
import { IdentityStoreType } from '../../../generated/graphql'
import { invariant } from '../../../util/invariant'
import { IdentityStoreEntity } from '../../identity-store/entities/identity-store-entity'
import { OidcIdentityResolverEntity } from '../entities/oidc-identity-resolver-entity'
import { notifyOidcDataChanged } from '../provider'

export async function CreateOidcIdentityResolverCommand(
  this: CommandContext,
  input: OidcIdentityResolverInput,
): Promise<OidcIdentityResolverEntity> {
  const identityStoreRepo = this.entityManager.getRepository(IdentityStoreEntity)
  const identityStore = await identityStoreRepo.findOneByOrFail({ id: input.identityStoreId })

  invariant(identityStore.type === IdentityStoreType.Entra, 'Only Entra identity stores are supported for OIDC identity resolvers.')

  const resolver = new OidcIdentityResolverEntity({
    name: input.name,
    credentialTypes: input.credentialTypes ?? null,
    claimName: input.claimName,
    identityStoreId: input.identityStoreId,
    identityStoreType: identityStore.type,
    lookupType: input.lookupType,
  })
  const entity = await this.entityManager.getRepository(OidcIdentityResolverEntity).save(resolver)
  notifyOidcDataChanged()

  return entity
}
