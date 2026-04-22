import { GraphQLError } from 'graphql'
import type { CommandContext } from '../../../cqs'
import type { IdentityStoreInput, IdentityStoreType } from '../../../generated/graphql'
import { invariant } from '../../../util/invariant'
import { notifyIdentityStoreChanged } from '../../instance-configs'
import { IdentityStoreEntity } from '../entities/identity-store-entity'
import { identityStoreSecretService } from '../index'

export async function CreateIdentityStoreCommand(this: CommandContext, input: IdentityStoreInput) {
  const { identifier, name, type, isAuthenticationEnabled, accessPackagesEnabled, clientId, clientSecret } = input

  validateClientInput(clientId, clientSecret)

  const repo = this.entityManager.getRepository(IdentityStoreEntity)
  const existing = await repo.findOneBy({ identifier })
  invariant(!existing, `IdentityStore identifier '${identifier}' already exists.`)

  if (clientId && clientSecret) {
    await identityStoreSecretService().set(clientId, clientSecret)
  }

  const identityStore = await repo.save(
    new IdentityStoreEntity({
      identifier,
      name,
      type: type as IdentityStoreType,
      isAuthenticationEnabled,
      accessPackagesEnabled,
      clientId: clientId ?? undefined,
    }),
  )
  notifyIdentityStoreChanged()
  return identityStore
}

export function validateClientInput(clientId?: string | null, clientSecret?: string | null): void {
  if (Boolean(clientId) !== Boolean(clientSecret)) {
    throw new GraphQLError("Both 'clientId' and 'clientSecret' must be provided together, or neither.", {
      extensions: { code: 'BAD_USER_INPUT', fields: ['clientId', 'clientSecret'] },
    })
  }
}
