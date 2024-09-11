import { dispatch, dispatchMultiTransactional, query } from '../../cqs'
import { type Resolvers } from '../../generated/graphql'
import { logger } from '../../logger'
import { assertExhaustive } from '../../util/type-helpers'
import { createdByUpdatedBy } from '../users/resolvers'
import { CancelAsyncIssuanceRequestCommand } from './commands/cancel-async-issuance-request-command'
import { CancelAsyncIssuanceRequestsCommand } from './commands/cancel-async-issuance-requests-command'
import { CreateAsyncIssuanceRequestCommand } from './commands/create-async-issuance-request-command'
import { CreateIssuanceRequestForAsyncIssuanceCommand } from './commands/create-issuance-request-for-async-issuance-command'
import { ResendAsyncNotificationCommand } from './commands/resend-async-issuance-notification-command'
import { ResendAsyncIssuanceNotificationsCommand } from './commands/resend-async-issuance-notifications-command'
import { UpdateAsyncIssuanceContactCommand } from './commands/update-async-issuance-contact-command'
import type { FailedStates } from './entities/async-issuance-entity'
import { failedStates } from './entities/async-issuance-entity'
import { FindAsyncIssuanceContactQuery } from './queries/async-issuance-contact-query'
import { FindAsyncIssuancesQuery } from './queries/find-async-issuances-query'

export const resolvers: Resolvers = {
  Query: {
    asyncIssuanceRequest: (_, { id }, { dataLoaders }) => dataLoaders.asyncIssuances.load(id),
    asyncIssuanceContact: (_, { asyncIssuanceRequestId }, context) => query(context, FindAsyncIssuanceContactQuery, asyncIssuanceRequestId),
    findAsyncIssuanceRequests: (_, { where, offset, limit, orderBy, orderDirection }, context) =>
      query(context, FindAsyncIssuancesQuery, where, offset, limit, orderBy, orderDirection),
  },
  Mutation: {
    createAsyncIssuanceRequest: (_, { request }, context) => dispatch(context, CreateAsyncIssuanceRequestCommand, request),
    createIssuanceRequestForAsyncIssuance: (_, { asyncIssuanceRequestId }, context) =>
      dispatchMultiTransactional(context, CreateIssuanceRequestForAsyncIssuanceCommand, asyncIssuanceRequestId),
    updateAsyncIssuanceContact: (_, { asyncIssuanceRequestId, contact }, context) =>
      dispatch(context, UpdateAsyncIssuanceContactCommand, asyncIssuanceRequestId, contact),
    resendAsyncIssuanceNotifications: (_, { asyncIssuanceRequestIds }, context) =>
      dispatch(context, ResendAsyncIssuanceNotificationsCommand, asyncIssuanceRequestIds),
    resendAsyncIssuanceNotification: (_, { asyncIssuanceRequestId }, context) =>
      dispatchMultiTransactional(context, ResendAsyncNotificationCommand, asyncIssuanceRequestId),
    cancelAsyncIssuanceRequest: (_, { asyncIssuanceRequestId }, context) =>
      dispatch(context, CancelAsyncIssuanceRequestCommand, asyncIssuanceRequestId),
    cancelAsyncIssuanceRequests: (_, { asyncIssuanceRequestIds }, context) =>
      dispatch(context, CancelAsyncIssuanceRequestsCommand, asyncIssuanceRequestIds),
  },
  AsyncIssuanceRequest: {
    identity: async (parent, _, { dataLoaders }) => dataLoaders.identities.load(parent.identityId),
    contract: async (parent, _, { dataLoaders }) => dataLoaders.contracts.load(parent.contractId),
    issuance: async (parent, _, { dataLoaders }) => (parent.issuanceId ? dataLoaders.issuances.load(parent.issuanceId) : null),
    failureReason: (parent) => {
      if (parent.state === 'contact-failed') return 'Failed to contact the issuee'
      if (parent.state === 'issuance-verification-failed') return 'Failed to verify the issuee'
      if (parent.state === 'issuance-failed') return 'Failed to issue the credential'
      if (failedStates.includes(parent.state as FailedStates)) {
        logger.warn(`Unhandled failed state ${parent.state}`)
        return 'Failed to issue the credential'
      }
      return null
    },
    ...createdByUpdatedBy,
  },
  AsyncIssuanceRequestResponse: {
    __resolveType: (response) => ('errors' in response ? 'AsyncIssuanceErrorResponse' : 'AsyncIssuanceResponse'),
  },
}
