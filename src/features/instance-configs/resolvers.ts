import { dispatch, query } from '../../cqs'
import type { Resolvers } from '../../generated/graphql'
import { SetApplicationLabelConfigsCommand } from './commands/set-application-label-configs-command'
import { SetCorsOriginConfigsCommand } from './commands/set-cors-configs-command'
import { FindApplicationLabelConfigsQuery } from './queries/find-application-label-configs-query'
import { FindCorsOriginConfigsQuery } from './queries/find-cors-origin-configs-query'

export const resolvers: Resolvers = {
  Query: {
    applicationLabelConfigs: (_parent, { identityStoreId }, context) => query(context, FindApplicationLabelConfigsQuery, identityStoreId),
    corsOriginConfigs: (_parent, _args, context) => query(context, FindCorsOriginConfigsQuery),
  },
  Mutation: {
    setApplicationLabelConfigs: (_parent, { identityStoreId, input }, context) =>
      dispatch(context, SetApplicationLabelConfigsCommand, identityStoreId, input),
    setCorsOriginConfigs: (_parent, { input }, context) => dispatch(context, SetCorsOriginConfigsCommand, input),
  },
}
