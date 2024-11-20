import { dispatch, query } from '../../cqs'
import type { Resolvers } from '../../generated/graphql'
import { compactErrors } from '../../util/compact-errors'
import { CreateOidcClientCommand } from './commands/create-oidc-client-command'
import { CreateOidcClientResourceCommand } from './commands/create-oidc-client-resource-command'
import { CreateOidcResourceCommand } from './commands/create-oidc-resource-command'
import { CreatePresentationRequestForAuthnCommand } from './commands/create-presentation-request-for-authn-command'
import { DeleteOidcClientCommand } from './commands/delete-oidc-client-command'
import { DeleteOidcClientResourceCommand } from './commands/delete-oidc-client-resource-command'
import { DeleteOidcResourceCommand } from './commands/delete-oidc-resource-command'
import { UpdateOidcClientCommand } from './commands/update-oidc-client-command'
import { UpdateOidcClientResourceCommand } from './commands/update-oidc-client-resource-command'
import { UpdateOidcResourceCommand } from './commands/update-oidc-resource-command'
import { FindOidcClientsQuery } from './queries/find-oidc-clients-query'
import { FindOidcResourcesQuery } from './queries/find-oidc-resources-query'

export const resolvers: Resolvers = {
  Mutation: {
    createPresentationRequestForAuthn: async (_parent, { request }, context) =>
      dispatch(context, CreatePresentationRequestForAuthnCommand, request),

    createOidcClient: async (_parent, { input }, context) => dispatch(context, CreateOidcClientCommand, input),
    updateOidcClient: async (_parent, { id, input }, context) => dispatch(context, UpdateOidcClientCommand, id, input),
    deleteOidcClient: async (_parent, { id }, context) => dispatch(context, DeleteOidcClientCommand, id),

    createOidcResource: async (_parent, { input }, context) => dispatch(context, CreateOidcResourceCommand, input),
    updateOidcResource: async (_parent, { id, input }, context) => dispatch(context, UpdateOidcResourceCommand, id, input),
    deleteOidcResource: async (_parent, { id }, context) => dispatch(context, DeleteOidcResourceCommand, id),

    createOidcClientResource: async (_parent, { clientId, input }, context) =>
      dispatch(context, CreateOidcClientResourceCommand, clientId, input),
    updateOidcClientResource: async (_parent, { clientId, input }, context) =>
      dispatch(context, UpdateOidcClientResourceCommand, clientId, input),
    deleteOidcClientResource: async (_parent, { clientId, resourceId }, context) =>
      dispatch(context, DeleteOidcClientResourceCommand, clientId, resourceId),
  },
  Query: {
    oidcClient: async (_parent, { id }, { dataLoaders: { oidcClients } }) => oidcClients.load(id),
    findOidcClients: async (_parent, { where, offset, limit, orderBy, orderDirection }, context) =>
      query(context, FindOidcClientsQuery, where, offset, limit, orderBy, orderDirection),
    oidcResource: async (_parent, { id }, { dataLoaders: { oidcResources } }) => oidcResources.load(id),
    findOidcResources: async (_parent, { where, offset, limit, orderBy, orderDirection }, context) =>
      query(context, FindOidcResourcesQuery, where, offset, limit, orderBy, orderDirection),
  },
  OidcClient: {
    partners: async (parent, _args, { dataLoaders: { partners } }) => partners.loadMany(parent.partnerIds).then(compactErrors),
  },
  OidcClientResource: {
    resource: async (parent, _args, { dataLoaders: { oidcResources } }) => oidcResources.load(parent.resourceId),
  },
}
