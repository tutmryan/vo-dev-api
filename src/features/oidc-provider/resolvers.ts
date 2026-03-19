import { generateOidcClientSecret } from '.'
import { dispatch, query } from '../../cqs'
import type { Resolvers } from '../../generated/graphql'
import { OidcClientType, OidcTokenEndpointAuthMethod } from '../../generated/graphql'
import { compactErrors } from '../../util/compact-errors'
import { CreateOidcClaimMappingCommand } from './commands/create-oidc-claim-mapping'
import { CreateOidcClientCommand } from './commands/create-oidc-client-command'
import { CreateOidcClientResourceCommand } from './commands/create-oidc-client-resource-command'
import { CreateOidcIdentityResolverCommand } from './commands/create-oidc-identity-resolver-command'
import { CreateOidcResourceCommand } from './commands/create-oidc-resource-command'
import { CreatePresentationRequestForAuthnCommand } from './commands/create-presentation-request-for-authn-command'
import { DeleteOidcClaimMappingCommand } from './commands/delete-oidc-claim-mapping-command'
import { DeleteOidcClientCommand } from './commands/delete-oidc-client-command'
import { DeleteOidcClientResourceCommand } from './commands/delete-oidc-client-resource-command'
import { DeleteOidcIdentityResolverCommand } from './commands/delete-oidc-identity-resolver-command'
import { DeleteOidcResourceCommand } from './commands/delete-oidc-resource-command'
import { UpdateConciergeClientBrandingCommand } from './commands/update-concierge-client-branding'
import { UpdateOidcClaimMappingCommand } from './commands/update-oidc-claim-mapping'
import { UpdateOidcClientClaimMappingsCommand } from './commands/update-oidc-client-claim-mappings-command'
import { UpdateOidcClientCommand } from './commands/update-oidc-client-command'
import { UpdateOidcClientIdentityResolversCommand } from './commands/update-oidc-client-identity-resolvers-command'
import { UpdateOidcClientResourceCommand } from './commands/update-oidc-client-resource-command'
import { UpdateOidcIdentityResolverCommand } from './commands/update-oidc-identity-resolver-command'
import { UpdateOidcResourceCommand } from './commands/update-oidc-resource-command'
import { FindOidcClaimMappingsQuery } from './queries/find-oidc-claim-mappings-query'
import { FindOidcClientsQuery } from './queries/find-oidc-clients-query'
import { FindOidcIdentityResolversQuery } from './queries/find-oidc-identity-resolvers-query'
import { FindOidcResourcesQuery } from './queries/find-oidc-resources-query'

export const resolvers: Resolvers = {
  Mutation: {
    createPresentationRequestForAuthn: async (_parent, _, context) => dispatch(context, CreatePresentationRequestForAuthnCommand),

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

    createOidcClaimMapping: async (_parent, { input }, context) => dispatch(context, CreateOidcClaimMappingCommand, input),
    updateOidcClaimMapping: async (_parent, { id, input }, context) => dispatch(context, UpdateOidcClaimMappingCommand, id, input),
    deleteOidcClaimMapping: async (_parent, { id }, context) => dispatch(context, DeleteOidcClaimMappingCommand, id),
    updateOidcClientClaimMappings: async (_parent, { clientId, claimMappingIds }, context) =>
      dispatch(context, UpdateOidcClientClaimMappingsCommand, clientId, claimMappingIds),
    createOidcIdentityResolver: async (_parent, { input }, context) => dispatch(context, CreateOidcIdentityResolverCommand, input),
    updateOidcIdentityResolver: async (_parent, { id, input }, context) => dispatch(context, UpdateOidcIdentityResolverCommand, id, input),
    deleteOidcIdentityResolver: async (_parent, { id }, context) => dispatch(context, DeleteOidcIdentityResolverCommand, id),
    updateOidcClientIdentityResolvers: async (_parent, { clientId, identityResolverIds }, context) =>
      dispatch(context, UpdateOidcClientIdentityResolversCommand, clientId, identityResolverIds),
    updateConciergeClientBranding: async (_parent, { input }, context) => dispatch(context, UpdateConciergeClientBrandingCommand, input),
    generateOidcClientSecret,
  },
  Query: {
    oidcClient: async (_parent, { id }, { dataLoaders: { oidcClients } }) => oidcClients.load(id),
    findOidcClients: async (_parent, { where, offset, limit, orderBy, orderDirection }, context) =>
      query(context, FindOidcClientsQuery, where, offset, limit, orderBy, orderDirection),
    oidcResource: async (_parent, { id }, { dataLoaders: { oidcResources } }) => oidcResources.load(id),
    findOidcResources: async (_parent, { where, offset, limit, orderBy, orderDirection }, context) =>
      query(context, FindOidcResourcesQuery, where, offset, limit, orderBy, orderDirection),
    oidcClaimMapping: async (_parent, { id }, { dataLoaders: { oidcClaimMappings } }) => oidcClaimMappings.load(id),
    findOidcClaimMappings: async (_parent, { where, offset, limit, orderBy, orderDirection }, context) =>
      query(context, FindOidcClaimMappingsQuery, where, offset, limit, orderBy, orderDirection),
    oidcIdentityResolver: async (_parent, { id }, { dataLoaders: { oidcIdentityResolvers } }) => oidcIdentityResolvers.load(id),
    findOidcIdentityResolvers: async (_parent, { where, offset, limit, orderBy, orderDirection }, context) =>
      query(context, FindOidcIdentityResolversQuery, where, offset, limit, orderBy, orderDirection),
  },
  OidcClient: {
    partners: async (parent, _args, { dataLoaders: { partners } }) => partners.loadMany(parent.partnerIds).then(compactErrors),
    claimMappings: async (parent, _args, { dataLoaders: { oidcClaimMappings } }) =>
      oidcClaimMappings.loadMany(parent.claimMappingIds).then(compactErrors),
    identityResolvers: async (parent, _args, { dataLoaders: { oidcIdentityResolvers } }) =>
      oidcIdentityResolvers.loadMany(parent.identityResolverIds).then(compactErrors),
    tokenEndpointAuthMethod: (parent) =>
      parent.tokenEndpointAuthMethod ??
      (parent.clientType === OidcClientType.Confidential ? OidcTokenEndpointAuthMethod.ClientSecretPost : OidcTokenEndpointAuthMethod.None),
  },
  OidcClientResource: {
    resource: async (parent, _args, { dataLoaders: { oidcResources } }) => oidcResources.load(parent.resourceId),
  },
  OidcClaimMapping: {
    mappings: (parent) => parent.getScopedClaimMappings(),
  },
  OidcIdentityResolver: {
    identityStore: async (parent, _args, { dataLoaders: { identityStores } }) => identityStores.load(parent.identityStoreId),
    createdBy: async (parent, _args, { dataLoaders: { users } }) => users.load(parent.createdById),
    updatedBy: async (parent, _args, { dataLoaders: { users } }) => (parent.updatedById ? users.load(parent.updatedById) : null),
  },
}
