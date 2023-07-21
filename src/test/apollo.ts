import type { GraphQLRequest } from '@apollo/server'
import { ApolloServer } from '@apollo/server'
import type { TypedDocumentNode } from '@graphql-typed-document-node/core'
import type { JwtPayload } from '@makerx/graphql-core'
import type { DocumentNode, FormattedExecutionResult } from 'graphql'
import type { GraphQLContext } from '../context'
import schema from '../schema'
import { buildJwt, createContext } from './context'

export const server = new ApolloServer<GraphQLContext>({
  schema: schema(),
})

type VariableValues = { [name: string]: any }

const executeOperation = async <TData = Record<string, unknown>, TVariables extends VariableValues = VariableValues>(
  request: Omit<GraphQLRequest<TVariables>, 'query'> & {
    query?: string | DocumentNode | TypedDocumentNode<TData, TVariables>
  },
  jwtPayload?: JwtPayload,
): Promise<FormattedExecutionResult<TData>> => {
  const response = await server.executeOperation(request, {
    contextValue: await createContext(jwtPayload),
  })
  if (response.body.kind !== 'single') throw new Error('Invalid response body kind')
  return response.body.singleResult as FormattedExecutionResult<TData>
}

export const executeOperationAs = async <TData = Record<string, unknown>, TVariables extends VariableValues = VariableValues>(
  request: Omit<GraphQLRequest<TVariables>, 'query'> & {
    query?: string | DocumentNode | TypedDocumentNode<TData, TVariables>
  },
  jwtPayload: JwtPayload,
): Promise<FormattedExecutionResult<TData>> => executeOperation(request, jwtPayload)

export const executeOperationAnonymous = async <TData = Record<string, unknown>, TVariables extends VariableValues = VariableValues>(
  request: Omit<GraphQLRequest<TVariables>, 'query'> & {
    query?: string | DocumentNode | TypedDocumentNode<TData, TVariables>
  },
): Promise<FormattedExecutionResult<TData>> => executeOperation(request)

export const executeOperationAsAdmin = async <TData = Record<string, unknown>, TVariables extends VariableValues = VariableValues>(
  request: Omit<GraphQLRequest<TVariables>, 'query'> & {
    query?: string | DocumentNode | TypedDocumentNode<TData, TVariables>
  },
): Promise<FormattedExecutionResult<TData>> => executeOperation(request, buildJwt())
