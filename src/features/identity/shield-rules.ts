import { rule } from 'graphql-shield'
import type { GraphQLContext } from '../../context'
import { userIsIdentityEntity } from '../../util/user-invariant'
import { AsyncIssuanceEntity } from '../async-issuance/entities/async-issuance-entity'
import { IssuanceEntity } from '../issuance/entities/issuance-entity'
import { PresentationEntity } from '../presentation/entities/presentation-entity'
import { IdentityEntity } from './entities/identity-entity'

export const identityIsAuthenticatedUser = rule('identityIsAuthenticatedUser', { cache: 'strict' })((
  parent,
  _,
  { user }: GraphQLContext,
) => {
  return parent instanceof IdentityEntity && userIsIdentityEntity(user) && parent.id === user.entity.id
})

export const asyncIssuanceIsToAuthenticatedUser = rule('asyncIssuanceIsToAuthenticatedUser', { cache: 'strict' })((
  parent,
  _,
  { user }: GraphQLContext,
) => {
  return parent instanceof AsyncIssuanceEntity && userIsIdentityEntity(user) && parent.identityId === user.entity.id
})

export const issuanceIsToAuthenticatedUser = rule('issuanceIsToAuthenticatedUser', { cache: 'strict' })((
  parent,
  _,
  { user }: GraphQLContext,
) => {
  return parent instanceof IssuanceEntity && userIsIdentityEntity(user) && parent.identityId === user.entity.id
})

export const presentationIsByAuthenticatedUser = rule('presentationIsByAuthenticatedUser', { cache: 'strict' })((
  parent,
  _,
  { user }: GraphQLContext,
) => {
  return parent instanceof PresentationEntity && userIsIdentityEntity(user) && parent.identityId === user.entity.id
})
