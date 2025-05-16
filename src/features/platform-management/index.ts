import type { HeadersConfig } from '@graphql-tools/executor-http'
import { buildHTTPExecutor } from '@graphql-tools/executor-http'
import { buildSchema } from 'graphql'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { platformManagement } from '../../config'
import type { GraphQLContext } from '../../context'

export function buildRemoteSchema() {
  if (!platformManagement.remoteUrl) return undefined

  const executor = buildHTTPExecutor({
    endpoint: platformManagement.remoteUrl,
    headers: (executionRequest) => {
      const context = executionRequest?.context as GraphQLContext | undefined
      if (!context || !context.user?.token) return {} as HeadersConfig
      return {
        Authorization: `Bearer ${context.user.token}`,
      }
    },
  })

  const typeDefs = readFileSync(join(__dirname, './remote-schema.graphql'), 'utf-8')
  const schema = buildSchema(typeDefs)

  return {
    executor,
    schema,
  }
}
