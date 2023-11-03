import { dispatch, query } from '../../cqs/dispatcher'
import type { Resolvers } from '../../generated/graphql'
import { resolvePresentationEventData, subscribeToPresentationEventsWithFilter } from './callback/pubsub'
import { CreatePresentationRequestCommand } from './commands/create-presentation-request-command'
import { resolvePresentedCredentials } from './presented-credentials-resolver'
import { CountPresentationsByContractQuery } from './queries/count-presentations-by-contract-query'
import { CountPresentationsByUserQuery } from './queries/count-presentations-by-user-query'
import { CountPresentationsQuery } from './queries/count-presentations-query'
import { FindPresentationsQuery } from './queries/find-presentations-query'
import { WeeklyAveragePresentationsByContractQuery } from './queries/weekly-average-presentations-by-contract-query'

export const resolvers: Resolvers = {
  Query: {
    findPresentations: (_parent, { where, offset, limit, orderBy, orderDirection }, context) =>
      query(context, FindPresentationsQuery, where, offset, limit, orderBy, orderDirection),
    presentationCount: (_parent, { where }, context) => query(context, CountPresentationsQuery, where),
    presentationCountByUser: (_parent, { where, offset, limit }, context) =>
      query(context, CountPresentationsByUserQuery, where, offset, limit),
    presentationCountByContract: (_parent, { where, offset, limit }, context) =>
      query(context, CountPresentationsByContractQuery, where, offset, limit),
  },
  Mutation: {
    createPresentationRequest: (_parent, { request }, context) => dispatch(context, CreatePresentationRequestCommand, request),
  },
  Presentation: {
    presentedCredentials: (presentation, _, { user }) => resolvePresentedCredentials(presentation, user),
  },
  Contract: {
    presentations: (contract, { where, offset, limit }, context) =>
      query(context, FindPresentationsQuery, { contractId: contract.id, ...where }, offset, limit),
    presentationWeeklyAverage: ({ id }, { where }, context) =>
      query(context, WeeklyAveragePresentationsByContractQuery, { contractId: id, ...where }),
  },
  Identity: {
    presentations: (identity, { where, offset, limit }, context) =>
      query(context, FindPresentationsQuery, { identityId: identity.id, ...where }, offset, limit),
  },
  User: {
    presentations: (user, { where, offset, limit }, context) =>
      query(context, FindPresentationsQuery, { requestedById: user.id, ...where }, offset, limit),
  },
  Issuance: {
    presentations: (issuance, { where, offset, limit }, context) =>
      query(context, FindPresentationsQuery, { issuanceId: issuance.id, ...where }, offset, limit),
  },
  Partner: {
    presentations: (partner, { where, offset, limit }, context) =>
      query(context, FindPresentationsQuery, { partnerId: partner.id, ...where }, offset, limit),
  },
  PresentationRequestResponse: {
    __resolveType: (response) => ('error' in response ? 'RequestErrorResponse' : 'PresentationResponse'),
  },
  Subscription: {
    presentationEvent: {
      subscribe: subscribeToPresentationEventsWithFilter,
      resolve: resolvePresentationEventData,
    },
  },
}
