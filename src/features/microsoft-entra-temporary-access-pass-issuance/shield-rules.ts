import { rule } from 'graphql-shield'
import type { GraphQLContext } from '../../context'
import { userIsIdentityEntity } from '../../util/user-invariant'
import { MicrosoftEntraTemporaryAccessPassIssuanceEntity } from './entities/microsoft-entra-temporary-access-pass-issuance-entity'

export const microsoftEntraTemporaryAccessPassIssuanceIsToAuthenticatedUser = rule(
  'microsoftEntraTemporaryAccessPassIssuanceIsToAuthenticatedUser',
  { cache: 'strict' },
)((parent, _, { user }: GraphQLContext) => {
  return (
    parent instanceof MicrosoftEntraTemporaryAccessPassIssuanceEntity && userIsIdentityEntity(user) && parent.identityId === user.entity.id
  )
})
