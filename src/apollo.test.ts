import type { ApolloServerPlugin } from '@apollo/server'
import { ApolloServer } from '@apollo/server'
import { GraphQLArmorConfig } from '@escape.tech/graphql-armor-types'
import { NoSchemaIntrospectionCustomRule, validate } from 'graphql'
import { createArmorProtection } from './apollo'
import { authenticatedIntrospectionPlugin } from './apollo.authenticatedIntrospectionPlugin'
import { graphQL } from './config'
import type { GraphQLContext } from './context'
import { UserRoles } from './roles'
import schema from './schema'
import { beforeAfterAll, buildJwt, executeOperation } from './test'

const buildAliasesQuery = (aliases: number) => {
  return `query { ${Array.from({ length: aliases }, (_, i) => `alias${i}: me { ... on User { id } }`).join(' ')}}`
}

const buildDirectivesQuery = (directives: number) => {
  return `query { ${Array.from({ length: directives }, (_, i) => `directive${i}: me @skip(if: true) { ... on User { id } }`).join(' ')}}`
}

const buildDepthQuery = (depth: number): string => {
  const buildChildren = (currentDepth: number): string => {
    if (currentDepth + 1 === depth) return ''
    return `
      children {
        id
        ${buildChildren(currentDepth + 1)}
      }
    `
  }
  return `
    query {
      findTemplates {
        ${buildChildren(1)}
      }
    }
  `
}

const buildTokenQuery = (tokens: number) => {
  const aliasesStart = 100000
  const tokensInQuery = `query {  }`.length
  const tokensInMeQuery = `token${aliasesStart}: me {... on User { id } }`.length
  const repeat = Math.floor(tokens - tokensInQuery / tokensInMeQuery)
  return `query { ${Array.from({ length: repeat }, (_, i) => `token${aliasesStart + i}: me { ... on User { id } }`).join(' ')}}`
}

const disabled = { enabled: false }
const disabledArmorConfig: GraphQLArmorConfig = {
  costLimit: disabled,
  maxAliases: disabled,
  maxDepth: disabled,
  maxTokens: disabled,
  maxDirectives: disabled,
}

const serversToCleanUp: Set<{ stop: () => void }> = new Set()

function createServer(config: Partial<GraphQLArmorConfig>) {
  const { protection } = createArmorProtection({
    ...disabledArmorConfig,
    ...config,
  })
  const server = new ApolloServer<GraphQLContext>({
    schema: schema(),
    ...protection,
  })
  serversToCleanUp.add(server)
  return server
}

function cleanUpServers() {
  serversToCleanUp.forEach((server) => server.stop())
  serversToCleanUp.clear()
}

function executeOperationAsUser(request: Parameters<typeof executeOperation>[0], server: ApolloServer<GraphQLContext>) {
  return executeOperation(request, buildJwt({ roles: [UserRoles.credentialAdmin] }), undefined, undefined, undefined, undefined, server)
}

describe('GraphQl Armor', () => {
  beforeAfterAll()
  afterEach(cleanUpServers)
  it('does not allow more than the default number of aliases', async () => {
    // Arrange
    const server = createServer({ maxAliases: { n: graphQL.maxAliases } })
    const query = buildAliasesQuery(graphQL.maxAliases + 1)

    // Act
    const { data, errors } = await executeOperationAsUser(
      {
        query,
      },
      server,
    )

    // Assert
    expect(data).toBeUndefined()
    expect(errors).toBeDefined()
    expect(errors).toHaveLength(1)
    expect(errors![0]!.message).toBe(`Syntax Error: Aliases limit of ${graphQL.maxAliases} exceeded, found ${graphQL.maxAliases + 1}.`)
  })
  it('does not allow more than the default number of directives', async () => {
    // Arrange
    const server = createServer({ maxDirectives: { n: graphQL.maxDirectives } })
    const query = buildDirectivesQuery(graphQL.maxDirectives + 1)

    // Act
    const { data, errors } = await executeOperationAsUser(
      {
        query,
      },
      server,
    )

    // Assert
    expect(data).toBeUndefined()
    expect(errors).toBeDefined()
    expect(errors).toHaveLength(1)
    expect(errors![0]!.message).toBe(
      `Syntax Error: Directives limit of ${graphQL.maxDirectives} exceeded, found ${graphQL.maxDirectives + 1}.`,
    )
  })
  it('does not allow more than the default depth', async () => {
    // Arrange
    const server = createServer({ maxDepth: { n: graphQL.maxDepth } })
    const query = buildDepthQuery(graphQL.maxDepth + 1)

    // Act
    const { data, errors } = await executeOperationAsUser(
      {
        query,
      },
      server,
    )

    // Assert
    expect(data).toBeUndefined()
    expect(errors).toBeDefined()
    expect(errors).toHaveLength(1)
    expect(errors![0]!.message).toBe(`Syntax Error: Query depth limit of ${graphQL.maxDepth} exceeded, found ${graphQL.maxDepth + 1}.`)
  })
  it('does not allow more than the default token amount', async () => {
    // Arrange
    const server = createServer({ maxTokens: { n: graphQL.maxTokens } })
    const query = buildTokenQuery(graphQL.maxTokens + 1)

    // Act
    let errorMessage = ''
    try {
      await executeOperationAsUser(
        {
          query,
        },
        server,
      )
    } catch (error: unknown) {
      if (error instanceof Error) errorMessage = error.message
    }

    // Assert
    expect(errorMessage).toBe(`Syntax Error: Token limit of ${graphQL.maxTokens} exceeded.`)
  })

  it('allows introspection for authenticated users', async () => {
    const authenticatedIntrospectionPlugin: ApolloServerPlugin<GraphQLContext> = {
      requestDidStart: async () => ({
        didResolveOperation: async ({ schema, document, contextValue }) => {
          if (!contextValue.user) {
            const errors = validate(schema, document, [NoSchemaIntrospectionCustomRule])
            if (errors.length) throw errors[0]
          }
        },
      }),
    }
    const server = new ApolloServer<GraphQLContext>({
      schema: schema(),
      plugins: [authenticatedIntrospectionPlugin],
    })
    serversToCleanUp.add(server)

    const query = `query { __schema { queryType { name } } }`
    const { data, errors } = await executeOperationAsUser(
      {
        query,
      },
      server,
    )

    expect(errors).toBeUndefined()
    expect(data).toBeDefined()
    expect((data as { __schema: unknown }).__schema).toBeDefined()
  })

  it('does not allow introspection for unauthenticated users', async () => {
    const server = new ApolloServer<GraphQLContext>({
      schema: schema(),
      plugins: [authenticatedIntrospectionPlugin],
    })
    serversToCleanUp.add(server)

    const query = `query { __schema { queryType { name } } }`
    const { data, errors } = await executeOperation(
      {
        query,
      },
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      server,
    )

    expect(data).toBeUndefined()
    expect(errors).toBeDefined()
    expect(errors![0]!.message).toBe('GraphQL introspection has been disabled, but the requested query contained the field "__schema".')
  })
})
