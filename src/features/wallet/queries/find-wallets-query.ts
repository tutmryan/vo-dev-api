import type { FindOptionsWhere } from 'typeorm'
import type { QueryContext } from '../../../cqs'
import type { Maybe, WalletWhere } from '../../../generated/graphql'
import { WalletEntity } from '../entities/wallet-entity'

export async function FindWalletsQuery(this: QueryContext, criteria?: Maybe<WalletWhere>, offset?: Maybe<number>, limit?: Maybe<number>) {
  const where: FindOptionsWhere<WalletEntity> = {}

  if (criteria?.id) where.id = criteria.id
  if (criteria?.subject) where.subject = criteria.subject

  if (criteria?.identityId) {
    where.presentations = {
      identityId: criteria.identityId,
    }
  }

  return this.entityManager.getRepository(WalletEntity).find({
    comment: 'FindWalletsQuery',
    where,
    relations: ['presentations'],
    skip: offset ?? undefined,
    take: limit ?? undefined,
  })
}
