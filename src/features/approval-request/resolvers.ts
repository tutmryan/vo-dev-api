import { dispatch, query } from '../../cqs/dispatcher'
import type { Resolvers } from '../../generated/graphql'
import { ActionApprovalRequestCommand } from './commands/action-approval-request-command'
import { CreateApprovalRequestCommand } from './commands/create-approval-request-command'
import { CreatePresentationRequestForApprovalCommand } from './commands/create-presentation-request-for-approval-command'
import { UpdateApprovalRequestCommand } from './commands/update-approval-request-command'
import { FindActionedApprovalDataQuery } from './queries/find-actioned-approval-data-query'

export const resolvers: Resolvers = {
  Mutation: {
    createApprovalRequest: (_, { request }, context) => dispatch(context, CreateApprovalRequestCommand, request),
    updateApprovalRequest: (_, { id, input }, context) => dispatch(context, UpdateApprovalRequestCommand, id, input),
    createPresentationRequestForApproval: (_, { approvalRequestId, input }, context) =>
      dispatch(context, CreatePresentationRequestForApprovalCommand, approvalRequestId, input ?? undefined),
    actionApprovalRequest: (_, { id, input }, context) => dispatch(context, ActionApprovalRequestCommand, id, input),
  },
  Query: {
    approvalRequest: (_, { id }, { dataLoaders: { approvalRequests } }) => approvalRequests.load(id),
    actionedApprovalData: (_, { id }, context) => query(context, FindActionedApprovalDataQuery, id),
  },
  ApprovalRequest: {
    requestedAt: ({ createdAt }) => createdAt,
  },
}
