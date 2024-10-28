import { and, rule } from 'graphql-shield'
import type { GraphQLContext } from '../../context'
import { InternalClientRoles } from '../../roles'
import { hasRoleRule } from '../../util/shield-utils'
import { userInvariant } from '../../util/user-invariant'
import { requestIdFilterDefined } from '../limited-access-tokens'
import { getLoginInteractionDataForSession } from './session'

export const isOidcAuthnClient = hasRoleRule(InternalClientRoles.limitedOidcAuthn, 'isOidcAuthnClient')

export const isValidOidcAuthnPresentationFilter = and(isOidcAuthnClient, requestIdFilterDefined)

export const isValidOidcAuthnPresentationRequest = and(
  isOidcAuthnClient,
  rule('isValidOidcAuthnPresentationRequest', { cache: 'strict' })(async (_parent, __args, { user }: GraphQLContext) => {
    userInvariant(user)
    const interactionData = await getLoginInteractionDataForSession(user.token)
    return interactionData?.state === 'started'
  }),
)
