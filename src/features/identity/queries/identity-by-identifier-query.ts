import type { QueryContext } from '../../../cqs'
import type { IssuerIdentifierInput } from '../../../generated/graphql'
import { IdentityEntity } from '../entities/identity-entity'

export async function IdentityByIdentifierQuery(this: QueryContext, { issuer, identifier }: IssuerIdentifierInput) {
  return this.entityManager.getRepository(IdentityEntity).findOneByOrFail({ issuer, identifier })
}
