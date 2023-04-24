import { query } from '../../cqrs/dispatcher'
import type { Resolvers } from '../../generated/graphql'
import { CredentialTypesQuery } from './queries/credential-types-query'

export const resolvers: Resolvers = {
  Query: {
    credentialTypes: (_, __, context) => query(context, CredentialTypesQuery),
  },
}
