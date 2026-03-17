import casual from 'casual'
import { graphql } from '../../../generated'
import type { OidcClaimMappingInput, OidcIdentityResolverInput } from '../../../generated/graphql'
import {
  OidcApplicationType,
  OidcClientType,
  OidcIdentityLookupType,
  type OidcClientInput,
  type OidcResourceInput,
} from '../../../generated/graphql'
import { UserRoles } from '../../../roles'
import { executeOperationAsUser } from '../../../test'

graphql(`
  fragment OidcClientFragment on OidcClient {
    id
    name
    applicationType
    clientType
    tokenEndpointAuthMethod
    clientJwks
    clientJwksUri
    logo
    backgroundColor
    backgroundImage
    policyUrl
    termsOfServiceUrl
    applicationType
    redirectUris
    postLogoutUris
    requireFaceCheck
    allowAnyPartner
    authorizationRequestsTypeJarEnabled
    authorizationRequestsTypeStandardEnabled
    relyingPartyJwks
    relyingPartyJwksUri
    partners {
      id
      name
      did
      credentialTypes
      linkedDomainUrls
    }
    uniqueClaimsForSubjectId
    credentialTypes
    resources {
      resource {
        id
        name
        resourceIndicator
        scopes
      }
      resourceScopes
    }
    createdBy {
      id
      name
    }
    createdAt
    updatedBy {
      id
      name
    }
    updatedAt
    deletedAt
  }
`)

export const createOidcClientMutation = graphql(`
  mutation CreateOidcClient($input: OidcClientInput!) {
    createOidcClient(input: $input) {
      ...OidcClientFragment
    }
  }
`)

export const updateOidcClientMutation = graphql(`
  mutation UpdateOidcClient($id: ID!, $input: OidcClientInput!) {
    updateOidcClient(id: $id, input: $input) {
      ...OidcClientFragment
    }
  }
`)

export const deleteOidcClientMutation = graphql(`
  mutation DeleteOidcClient($id: ID!) {
    deleteOidcClient(id: $id) {
      ...OidcClientFragment
    }
  }
`)

export const findOidcClientsQuery = graphql(`
  query FindOidcClients(
    $where: OidcClientWhere
    $offset: NonNegativeInt
    $limit: PositiveInt
    $orderBy: OidcClientOrderBy
    $orderDirection: OrderDirection
  ) {
    findOidcClients(where: $where, offset: $offset, limit: $limit, orderBy: $orderBy, orderDirection: $orderDirection) {
      ...OidcClientFragment
    }
  }
`)

export const oidcClientQuery = graphql(`
  query OidcClient($id: ID!) {
    oidcClient(id: $id) {
      ...OidcClientFragment
    }
  }
`)

graphql(`
  fragment OidcResourceFragment on OidcResource {
    id
    name
    resourceIndicator
    scopes
    createdBy {
      id
      name
    }
    createdAt
    updatedBy {
      id
      name
    }
    updatedAt
    deletedAt
  }
`)

export const createOidcResourceMutation = graphql(`
  mutation CreateOidcResource($input: OidcResourceInput!) {
    createOidcResource(input: $input) {
      ...OidcResourceFragment
    }
  }
`)

export const updateOidcResourceMutation = graphql(`
  mutation UpdateOidcResource($id: ID!, $input: OidcResourceInput!) {
    updateOidcResource(id: $id, input: $input) {
      ...OidcResourceFragment
    }
  }
`)

export const deleteOidcResourceMutation = graphql(`
  mutation DeleteOidcResource($id: ID!) {
    deleteOidcResource(id: $id) {
      ...OidcResourceFragment
    }
  }
`)

export const findOidcResourcesQuery = graphql(`
  query FindOidcResources(
    $where: OidcResourceWhere
    $offset: NonNegativeInt
    $limit: PositiveInt
    $orderBy: OidcResourceOrderBy
    $orderDirection: OrderDirection
  ) {
    findOidcResources(where: $where, offset: $offset, limit: $limit, orderBy: $orderBy, orderDirection: $orderDirection) {
      ...OidcResourceFragment
    }
  }
`)

export const oidcResourceQuery = graphql(`
  query OidcResource($id: ID!) {
    oidcResource(id: $id) {
      ...OidcResourceFragment
    }
  }
`)

export const updateConciergeClientBrandingMutation = graphql(`
  mutation UpdateConciergeClientBranding($input: ConciergeClientBrandingInput!) {
    updateConciergeClientBranding(input: $input) {
      ...OidcClientFragment
    }
  }
`)

export function createOidcClientInput(input: Partial<OidcClientInput> = {}): OidcClientInput {
  return {
    name: casual.name,
    applicationType: OidcApplicationType.Web,
    clientType: OidcClientType.Public,
    redirectUris: [casual.url.toLowerCase().replace('http', 'https')],
    postLogoutUris: [casual.url.toLowerCase().replace('http', 'https')],
    requireFaceCheck: casual.boolean,
    allowAnyPartner: casual.boolean,
    logo: casual.url.toLowerCase(),
    backgroundColor: casual.rgb_hex,
    backgroundImage: casual.url.toLowerCase(),
    credentialTypes: [casual.word],
    policyUrl: casual.url.toLowerCase(),
    termsOfServiceUrl: casual.url.toLowerCase(),
    uniqueClaimsForSubjectId: [casual.word],
    ...input,
  }
}

export async function createOidcClient(input: Partial<OidcClientInput> = {}) {
  return executeOperationAsUser(
    { query: createOidcClientMutation, variables: { input: createOidcClientInput(input) } },
    UserRoles.oidcAdmin,
  )
}

export function createOidcResourceInput(input: Partial<OidcResourceInput> = {}): OidcResourceInput {
  return {
    name: casual.name,
    resourceIndicator: casual.url.toLowerCase(),
    scopes: [casual.word, casual.word],
    ...input,
  }
}

export async function createOidcResource(input: Partial<OidcResourceInput> = {}) {
  return executeOperationAsUser(
    { query: createOidcResourceMutation, variables: { input: createOidcResourceInput(input) } },
    UserRoles.oidcAdmin,
  )
}

export const createOidcClientResourceMutation = graphql(`
  mutation CreateOidcClientResource($clientId: ID!, $input: OidcClientResourceInput!) {
    createOidcClientResource(clientId: $clientId, input: $input) {
      ...OidcClientFragment
    }
  }
`)

export const updateOidcClientResourceMutation = graphql(`
  mutation UpdateOidcClientResource($clientId: ID!, $input: OidcClientResourceInput!) {
    updateOidcClientResource(clientId: $clientId, input: $input) {
      ...OidcClientFragment
    }
  }
`)

export const deleteOidcClientResourceMutation = graphql(`
  mutation DeleteOidcClientResource($clientId: ID!, $resourceId: ID!) {
    deleteOidcClientResource(clientId: $clientId, resourceId: $resourceId) {
      ...OidcClientFragment
    }
  }
`)

graphql(`
  fragment OidcClaimMappingFragment on OidcClaimMapping {
    id
    name
    credentialTypes
    mappings {
      scope
      claim
      credentialClaim
    }
    createdAt
    createdBy {
      id
      name
    }
    updatedAt
    updatedBy {
      id
      name
    }
    deletedAt
  }
`)

export const oidcClaimMappingQuery = graphql(`
  query OidcClaimMapping($id: ID!) {
    oidcClaimMapping(id: $id) {
      ...OidcClaimMappingFragment
    }
  }
`)

export const findOidcClaimMappingsQuery = graphql(`
  query FindOidcClaimMappings(
    $where: OidcClaimMappingWhere
    $offset: NonNegativeInt
    $limit: PositiveInt
    $orderBy: OidcClaimMappingOrderBy
    $orderDirection: OrderDirection
  ) {
    findOidcClaimMappings(where: $where, offset: $offset, limit: $limit, orderBy: $orderBy, orderDirection: $orderDirection) {
      ...OidcClaimMappingFragment
    }
  }
`)

export const createOidcClaimMappingMutation = graphql(`
  mutation CreateOidcClaimMapping($input: OidcClaimMappingInput!) {
    createOidcClaimMapping(input: $input) {
      ...OidcClaimMappingFragment
    }
  }
`)

export const updateOidcClaimMappingMutation = graphql(`
  mutation UpdateOidcClaimMapping($id: ID!, $input: OidcClaimMappingInput!) {
    updateOidcClaimMapping(id: $id, input: $input) {
      ...OidcClaimMappingFragment
    }
  }
`)

export const deleteOidcClaimMappingMutation = graphql(`
  mutation DeleteOidcClaimMapping($id: ID!) {
    deleteOidcClaimMapping(id: $id) {
      ...OidcClaimMappingFragment
    }
  }
`)

export function createOidcClaimMappingInput(input: Partial<OidcClaimMappingInput> = {}): OidcClaimMappingInput {
  return {
    name: casual.name,
    credentialTypes: [casual.word],
    mappings: [
      {
        scope: casual.word,
        claim: casual.word,
        credentialClaim: casual.word,
      },
    ],
    ...input,
  }
}

export async function createOidcClaimMapping(input: Partial<OidcClaimMappingInput> = {}) {
  return executeOperationAsUser(
    { query: createOidcClaimMappingMutation, variables: { input: createOidcClaimMappingInput(input) } },
    UserRoles.oidcAdmin,
  )
}

export const updateOidcClientClaimMappingsMutation = graphql(`
  mutation UpdateOidcClientClaimMappings($clientId: ID!, $claimMappingIds: [ID!]!) {
    updateOidcClientClaimMappings(clientId: $clientId, claimMappingIds: $claimMappingIds) {
      ...OidcClientFragment
      claimMappings {
        ...OidcClaimMappingFragment
      }
    }
  }
`)

graphql(`
  fragment OidcIdentityResolverFragment on OidcIdentityResolver {
    id
    name
    credentialTypes
    claimName
    identityStoreType
    identityStore {
      id
      name
    }
    lookupType
    createdAt
    createdBy {
      id
      name
    }
    updatedAt
    updatedBy {
      id
      name
    }
    deletedAt
  }
`)

export const oidcIdentityResolverQuery = graphql(`
  query OidcIdentityResolver($id: ID!) {
    oidcIdentityResolver(id: $id) {
      ...OidcIdentityResolverFragment
    }
  }
`)

export const findOidcIdentityResolversQuery = graphql(`
  query FindOidcIdentityResolvers(
    $where: OidcIdentityResolverWhere
    $offset: PositiveInt
    $limit: PositiveInt
    $orderBy: OidcIdentityResolverOrderBy
    $orderDirection: OrderDirection
  ) {
    findOidcIdentityResolvers(where: $where, offset: $offset, limit: $limit, orderBy: $orderBy, orderDirection: $orderDirection) {
      ...OidcIdentityResolverFragment
    }
  }
`)

export const createOidcIdentityResolverMutation = graphql(`
  mutation CreateOidcIdentityResolver($input: OidcIdentityResolverInput!) {
    createOidcIdentityResolver(input: $input) {
      ...OidcIdentityResolverFragment
    }
  }
`)

export const updateOidcIdentityResolverMutation = graphql(`
  mutation UpdateOidcIdentityResolver($id: ID!, $input: OidcIdentityResolverInput!) {
    updateOidcIdentityResolver(id: $id, input: $input) {
      ...OidcIdentityResolverFragment
    }
  }
`)

export const deleteOidcIdentityResolverMutation = graphql(`
  mutation DeleteOidcIdentityResolver($id: ID!) {
    deleteOidcIdentityResolver(id: $id) {
      ...OidcIdentityResolverFragment
    }
  }
`)

export const updateOidcClientIdentityResolversMutation = graphql(`
  mutation UpdateOidcClientIdentityResolvers($clientId: ID!, $identityResolverIds: [ID!]!) {
    updateOidcClientIdentityResolvers(clientId: $clientId, identityResolverIds: $identityResolverIds) {
      ...OidcClientFragment
      identityResolvers {
        ...OidcIdentityResolverFragment
      }
    }
  }
`)

export function createOidcIdentityResolverInput(
  identityStoreId: string,
  input: Partial<Omit<OidcIdentityResolverInput, 'identityStoreId'>> = {},
): OidcIdentityResolverInput {
  return {
    name: casual.name,
    credentialTypes: [casual.word],
    claimName: casual.word,
    identityStoreId,
    lookupType: OidcIdentityLookupType.Email,
    ...input,
  }
}

export async function createOidcIdentityResolver(identityStoreId: string, input: Partial<OidcIdentityResolverInput> = {}) {
  return executeOperationAsUser(
    { query: createOidcIdentityResolverMutation, variables: { input: createOidcIdentityResolverInput(identityStoreId, input) } },
    UserRoles.oidcAdmin,
  )
}
