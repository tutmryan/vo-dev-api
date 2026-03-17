import type { CommandContext } from '../../../cqs'
import { OidcIdentityResolverEntity } from '../entities/oidc-identity-resolver-entity'
import { notifyOidcDataChanged } from '../provider'

export async function DeleteOidcIdentityResolverCommand(this: CommandContext, id: string) {
  const repo = this.entityManager.getRepository(OidcIdentityResolverEntity)

  const resolver = await repo.findOneByOrFail({ id })
  const deleted = await repo.softRemove(resolver)

  notifyOidcDataChanged()
  return deleted
}
