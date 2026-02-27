import type { GraphQLRequest } from '@apollo/server'
import { ApolloServer } from '@apollo/server'
import type { TypedDocumentNode } from '@graphql-typed-document-node/core'
import type { JwtPayload } from '@makerx/graphql-core'
import type { DocumentNode, FormattedExecutionResult } from 'graphql'
import type { GraphQLContext } from '../context'
import type { AsyncIssuanceSessionData } from '../features/async-issuance/session'
import type { AcquireLimitedAccessTokenInput } from '../generated/graphql'
import type { AppRoles } from '../roles'
import { InternalRoles, UserRoles } from '../roles'
import schema from '../schema'
import type { LimitedPhotoCaptureOperationInput, LimitedPresentationFlowOperationInput } from './context'
import { buildIssueeJwt, buildJwt, createContext } from './context'

const server = new ApolloServer<GraphQLContext>({
  schema: schema(),
})

type VariableValues = { [name: string]: any }

export const executeOperation = async <TData = Record<string, unknown>, TVariables extends VariableValues = VariableValues>(
  request: Omit<GraphQLRequest<TVariables>, 'query'> & {
    query?: string | DocumentNode | TypedDocumentNode<TData, TVariables>
  },
  jwtPayload?: JwtPayload,
  limitedAccessData?: AcquireLimitedAccessTokenInput,
  limitedPresentationFlowData?: LimitedPresentationFlowOperationInput,
  limitedPhotoCaptureData?: LimitedPhotoCaptureOperationInput,
  limitedAsyncIssuanceData?: AsyncIssuanceSessionData,
  serverInstance = server,
): Promise<FormattedExecutionResult<TData>> => {
  const response = await serverInstance.executeOperation(request, {
    contextValue: await createContext(
      jwtPayload,
      limitedAccessData,
      limitedPresentationFlowData,
      limitedPhotoCaptureData,
      limitedAsyncIssuanceData,
    ),
  })
  if (response.body.kind !== 'single') throw new Error('Invalid response body kind')
  return response.body.singleResult as FormattedExecutionResult<TData>
}

export const executeOperationAs = async <TData = Record<string, unknown>, TVariables extends VariableValues = VariableValues>(
  request: Omit<GraphQLRequest<TVariables>, 'query'> & {
    query?: string | DocumentNode | TypedDocumentNode<TData, TVariables>
  },
  jwtPayload: JwtPayload,
  limitedAccessData?: AcquireLimitedAccessTokenInput,
  limitedPresentationFlowData?: LimitedPresentationFlowOperationInput,
): Promise<FormattedExecutionResult<TData>> => executeOperation(request, jwtPayload, limitedAccessData, limitedPresentationFlowData)

export const executeOperationAnonymous = async <TData = Record<string, unknown>, TVariables extends VariableValues = VariableValues>(
  request: Omit<GraphQLRequest<TVariables>, 'query'> & {
    query?: string | DocumentNode | TypedDocumentNode<TData, TVariables>
  },
): Promise<FormattedExecutionResult<TData>> => executeOperation(request)

export const executeOperationAsUser = async <TData = Record<string, unknown>, TVariables extends VariableValues = VariableValues>(
  request: Omit<GraphQLRequest<TVariables>, 'query'> & {
    query?: string | DocumentNode | TypedDocumentNode<TData, TVariables>
  },
  ...roles: UserRoles[]
): Promise<FormattedExecutionResult<TData>> => executeOperation(request, buildJwt({ roles }))

export const executeOperationAsCredentialAdmin = async <
  TData = Record<string, unknown>,
  TVariables extends VariableValues = VariableValues,
>(
  request: Omit<GraphQLRequest<TVariables>, 'query'> & {
    query?: string | DocumentNode | TypedDocumentNode<TData, TVariables>
  },
): Promise<FormattedExecutionResult<TData>> => executeOperationAsUser(request, UserRoles.credentialAdmin)

export const executeOperationAsInstanceAdmin = async <TData = Record<string, unknown>, TVariables extends VariableValues = VariableValues>(
  request: Omit<GraphQLRequest<TVariables>, 'query'> & {
    query?: string | DocumentNode | TypedDocumentNode<TData, TVariables>
  },
): Promise<FormattedExecutionResult<TData>> => executeOperationAsUser(request, UserRoles.instanceAdmin)

export const executeOperationAsPartnerAdmin = async <TData = Record<string, unknown>, TVariables extends VariableValues = VariableValues>(
  request: Omit<GraphQLRequest<TVariables>, 'query'> & {
    query?: string | DocumentNode | TypedDocumentNode<TData, TVariables>
  },
): Promise<FormattedExecutionResult<TData>> => executeOperationAsUser(request, UserRoles.partnerAdmin)

export const executeOperationAsLimitedAccessClient = async <
  TData = Record<string, unknown>,
  TVariables extends VariableValues = VariableValues,
>(
  request: Omit<GraphQLRequest<TVariables>, 'query'> & {
    query?: string | DocumentNode | TypedDocumentNode<TData, TVariables>
  },
  limitedAccessData?: AcquireLimitedAccessTokenInput,
): Promise<FormattedExecutionResult<TData>> =>
  executeOperation(request, buildJwt({ roles: [InternalRoles.limitedAccess] }), limitedAccessData)

export const executeOperationAsLimitedPresentationFlowClient = async <
  TData = Record<string, unknown>,
  TVariables extends VariableValues = VariableValues,
>(
  request: Omit<GraphQLRequest<TVariables>, 'query'> & {
    query?: string | DocumentNode | TypedDocumentNode<TData, TVariables>
  },
  limitedPresentationFlowData?: LimitedPresentationFlowOperationInput,
): Promise<FormattedExecutionResult<TData>> =>
  executeOperation(request, buildJwt({ roles: [InternalRoles.limitedPresentationFlow] }), undefined, limitedPresentationFlowData)

export const executeOperationAsLimitedPhotoCaptureClient = async <
  TData = Record<string, unknown>,
  TVariables extends VariableValues = VariableValues,
>(
  request: Omit<GraphQLRequest<TVariables>, 'query'> & {
    query?: string | DocumentNode | TypedDocumentNode<TData, TVariables>
  },
  limitedPhotoCaptureData?: LimitedPhotoCaptureOperationInput,
): Promise<FormattedExecutionResult<TData>> =>
  executeOperation(request, buildJwt({ roles: [InternalRoles.limitedPhotoCapture] }), undefined, undefined, limitedPhotoCaptureData)

export const executeOperationAsApp = async <TData = Record<string, unknown>, TVariables extends VariableValues = VariableValues>(
  request: Omit<GraphQLRequest<TVariables>, 'query'> & {
    query?: string | DocumentNode | TypedDocumentNode<TData, TVariables>
  },
  ...roles: AppRoles[]
): Promise<FormattedExecutionResult<TData>> => executeOperation(request, buildJwt({ roles }))

export const executeOperationAsLimitedAsyncIssuanceClient = async <
  TData = Record<string, unknown>,
  TVariables extends VariableValues = VariableValues,
>(
  request: Omit<GraphQLRequest<TVariables>, 'query'> & {
    query?: string | DocumentNode | TypedDocumentNode<TData, TVariables>
  },
  limitedPhotoCaptureData?: LimitedPhotoCaptureOperationInput,
  limitedAsyncIssuanceData?: AsyncIssuanceSessionData,
): Promise<FormattedExecutionResult<TData>> =>
  executeOperation(
    request,
    buildJwt({ roles: [InternalRoles.limitedAsyncIssuance] }),
    undefined,
    undefined,
    limitedPhotoCaptureData,
    limitedAsyncIssuanceData,
  )

export const executeOperationAsIssuee = async <TData = Record<string, unknown>, TVariables extends VariableValues = VariableValues>(
  request: Omit<GraphQLRequest<TVariables>, 'query'> & {
    query?: string | DocumentNode | TypedDocumentNode<TData, TVariables>
  },
  identityId: string,
): Promise<FormattedExecutionResult<TData>> => executeOperation(request, buildIssueeJwt(identityId))
