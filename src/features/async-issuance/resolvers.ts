import { dispatch, dispatchTransactional, query } from '../../cqs'
import { AsyncIssuanceRequestStatus, type Resolvers } from '../../generated/graphql'
import { createdByUpdatedBy } from '../users/resolvers'
import { CancelAsyncIssuanceRequestCommand } from './commands/cancel-async-issuance-request-command'
import { CancelAsyncIssuanceRequestsCommand } from './commands/cancel-async-issuance-requests-command'
import { CreateAsyncIssuanceRequestCommand } from './commands/create-async-issuance-request-command'
import { CreateIssuanceRequestForAsyncIssuanceCommand } from './commands/create-issuance-request-for-async-issuance-command'
import { ResendAsyncNotificationCommand } from './commands/resend-async-issuance-notification-command'
import { ResendAsyncIssuanceNotificationsCommand } from './commands/resend-async-issuance-notifications-command'
import { UpdateAsyncIssuanceContactCommand } from './commands/update-async-issuance-contact-command'
import { FindAsyncIssuanceContactQuery } from './queries/async-issuance-contact-query'
import { FindAsyncIssuancesQuery } from './queries/find-async-issuances-query'

const resolvePhotoCapture: Required<Resolvers>['AsyncIssuanceRequest']['photoCapture'] = async (
  { status, id, expiry },
  _,
  { dataLoaders: { asyncIssuanceContact } },
) => {
  if (status !== AsyncIssuanceRequestStatus.Pending) return null
  const data = await asyncIssuanceContact.load({ id, expiry })
  const value = data?.photoCapture
  if (value === undefined) return null
  return value
}

const resolveHasContactFieldSet: (
  contactField: 'notification' | 'verification',
) => Required<Resolvers>['AsyncIssuanceRequest']['hasContactNotificationSet'] = (contactField) => {
  return async ({ status, id, expiry }, _, { dataLoaders: { asyncIssuanceContact } }) => {
    if (status !== AsyncIssuanceRequestStatus.Pending) return null
    const data = await asyncIssuanceContact.load({ id, expiry })
    const field = data?.contact?.[contactField]
    return !!field?.method && !!field.value
  }
}

export const resolvers: Resolvers = {
  Query: {
    asyncIssuanceRequest: (_, { id }, { dataLoaders }) => dataLoaders.asyncIssuances.load(id),
    asyncIssuanceContact: (_, { asyncIssuanceRequestId }, context) => query(context, FindAsyncIssuanceContactQuery, asyncIssuanceRequestId),
    findAsyncIssuanceRequests: (_, { where, offset, limit, orderBy, orderDirection }, context) =>
      query(context, FindAsyncIssuancesQuery, where, offset, limit, orderBy, orderDirection),
  },
  Mutation: {
    createAsyncIssuanceRequest: (_, { request }, context) => dispatch(context, CreateAsyncIssuanceRequestCommand, request),
    createIssuanceRequestForAsyncIssuance: (_, { asyncIssuanceRequestId, photo }, context) =>
      dispatchTransactional(context, CreateIssuanceRequestForAsyncIssuanceCommand, asyncIssuanceRequestId, photo ?? undefined),
    updateAsyncIssuanceContact: (_, { asyncIssuanceRequestId, contact }, context) =>
      dispatch(context, UpdateAsyncIssuanceContactCommand, asyncIssuanceRequestId, contact),
    resendAsyncIssuanceNotifications: (_, { asyncIssuanceRequestIds }, context) =>
      dispatch(context, ResendAsyncIssuanceNotificationsCommand, asyncIssuanceRequestIds),
    resendAsyncIssuanceNotification: (_, { asyncIssuanceRequestId }, context) =>
      dispatchTransactional(context, ResendAsyncNotificationCommand, asyncIssuanceRequestId),
    cancelAsyncIssuanceRequest: (_, { asyncIssuanceRequestId }, context) =>
      dispatch(context, CancelAsyncIssuanceRequestCommand, asyncIssuanceRequestId),
    cancelAsyncIssuanceRequests: (_, { asyncIssuanceRequestIds }, context) =>
      dispatch(context, CancelAsyncIssuanceRequestsCommand, asyncIssuanceRequestIds),
  },
  AsyncIssuanceRequest: {
    identity: async (parent, _, { dataLoaders }) => dataLoaders.identities.load(parent.identityId),
    contract: async (parent, _, { dataLoaders }) => dataLoaders.contracts.load(parent.contractId),
    issuance: async (parent, _, { dataLoaders }) => (parent.issuanceId ? dataLoaders.issuances.load(parent.issuanceId) : null),
    ...createdByUpdatedBy,
    photoCapture: resolvePhotoCapture,
    hasContactNotificationSet: resolveHasContactFieldSet('notification'),
    hasContactVerificationSet: resolveHasContactFieldSet('verification'),
  },
  AsyncIssuanceRequestResponse: {
    __resolveType: (response) => ('errors' in response ? 'AsyncIssuanceErrorResponse' : 'AsyncIssuanceResponse'),
  },
  Identity: {
    asyncIssuanceRequests: (identity, { where, offset, limit }, context) =>
      query(context, FindAsyncIssuancesQuery, { identityId: identity.id, ...where }, offset, limit),
  },
  Contract: {
    asyncIssuanceRequests: (contract, { where, offset, limit }, context) =>
      query(context, FindAsyncIssuancesQuery, { contractId: contract.id, ...where }, offset, limit),
  },
}
