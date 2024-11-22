import casual from 'casual'
import { graphql } from '../../../generated'
import { type OidcClientInput, type OidcResourceInput } from '../../../generated/graphql'
import { UserRoles } from '../../../roles'
import { executeOperationAsUser } from '../../../test'

graphql(`
  fragment OidcClientFragment on OidcClient {
    id
    name
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
    $offset: PositiveInt
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
    $offset: PositiveInt
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

export function createOidcClientInput(input: Partial<OidcClientInput> = {}): OidcClientInput {
  return {
    name: casual.name,
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
