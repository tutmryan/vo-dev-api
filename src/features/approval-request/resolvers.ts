import { dispatch } from '../../cqs/dispatcher'
import type { Resolvers } from '../../generated/graphql'
import { CreateApprovalRequestCommand } from './commands/create-approval-request-command'

export const resolvers: Resolvers = {
  Mutation: {
    createApprovalRequest: (_, { request }, context) => dispatch(context, CreateApprovalRequestCommand, request),
  },
  ApprovalRequest: {},
}
