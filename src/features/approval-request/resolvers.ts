import { dispatch } from '../../cqs/dispatcher'
import type { Resolvers } from '../../generated/graphql'
import { ActionApprovalRequestCommand } from './commands/action-approval-request-command'
import { CreateApprovalRequestCommand } from './commands/create-approval-request-command'
import { CreatePresentationRequestForApprovalCommand } from './commands/create-presentation-request-for-approval-command'

export const resolvers: Resolvers = {
  Mutation: {
    createApprovalRequest: (_, { request }, context) => dispatch(context, CreateApprovalRequestCommand, request),
    createPresentationRequestForApproval: (_, { request }, context) =>
      dispatch(context, CreatePresentationRequestForApprovalCommand, request),
    actionApprovalRequest: (_, { id, input }, context) => dispatch(context, ActionApprovalRequestCommand, id, input),
  },
  Query: {
    approvalRequest: (_, { id }, { dataLoaders: { approvalRequests } }) => approvalRequests.load(id),
  },
  ApprovalRequest: {
    requestedAt: ({ createdAt }) => createdAt,
  },
}
