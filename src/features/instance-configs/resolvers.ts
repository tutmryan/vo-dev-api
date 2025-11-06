import { dispatch, query } from '../../cqs'
import type { Resolvers } from '../../generated/graphql'
import { SetApplicationLabelConfigsCommand } from './commands/set-application-label-configs-command'
import { SetCorsOriginConfigsCommand } from './commands/set-cors-configs-command'
import { SetEmailSenderConfigCommand } from './commands/set-email-sender-configs-command'
import { FindApplicationLabelConfigsQuery } from './queries/find-application-label-configs-query'
import { FindCorsOriginConfigsQuery } from './queries/find-cors-origin-configs-query'
import { FindEmailSenderConfigQuery } from './queries/find-email-sender-config-query'

export const resolvers: Resolvers = {
  Query: {
    applicationLabelConfigs: (_parent, { identityStoreId }, context) => query(context, FindApplicationLabelConfigsQuery, identityStoreId),
    corsOriginConfigs: (_parent, _args, context) => query(context, FindCorsOriginConfigsQuery),
    emailSenderConfig: (_parent, _args, context) => query(context, FindEmailSenderConfigQuery),
  },
  Mutation: {
    setApplicationLabelConfigs: (_parent, { identityStoreId, input }, context) =>
      dispatch(context, SetApplicationLabelConfigsCommand, identityStoreId, input),
    setCorsOriginConfigs: (_parent, { input }, context) => dispatch(context, SetCorsOriginConfigsCommand, input),
    setEmailSenderConfig: (_parent, { input }, context) => dispatch(context, SetEmailSenderConfigCommand, input),
  },
}
