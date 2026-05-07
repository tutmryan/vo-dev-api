import { In } from 'typeorm'

import type { CommandContext } from '../../../cqs'
import { OidcClientEntity } from '../entities/oidc-client-entity'
import { OidcIdentityResolverEntity } from '../entities/oidc-identity-resolver-entity'
import { notifyOidcDataChanged } from '../provider'

export async function UpdateOidcClientIdentityResolversCommand(
  this: CommandContext,
  id: string,
  identityResolverIds: string[],
): Promise<OidcClientEntity> {
  const clientRepo = this.entityManager.getRepository(OidcClientEntity)
  const client = await clientRepo.findOneByOrFail({ id })

  const resolvers = await this.entityManager
    .getRepository(OidcIdentityResolverEntity)
    .find({ where: { id: In(identityResolverIds) }, order: { name: 'ASC' } })

  client.identityResolvers = Promise.resolve(resolvers)
  const updated = await clientRepo.save(client)

  notifyOidcDataChanged()

  return updated
}
