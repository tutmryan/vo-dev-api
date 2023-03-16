import type { JwtPayload, RequestInfo } from '@makerxstudio/graphql-core'
import { User } from '@makerxstudio/graphql-core'
import casual from 'casual'
import { randomUUID } from 'crypto'
import type { GraphQLContext } from '../context'
import { dataSource } from '../data'
import { logger } from '../logger'
import { createServices } from '../services'

const requestInfo: RequestInfo = {
  host: 'localhost',
  url: 'http://localhost/graphql',
  method: 'TEST',
  referer: 'jest',
  requestId: 'test',
}

interface BuildJwtInput {
  oid: string
  iss: string
  email: string
  scopes: string[]
  roles: string[]
}

export const buildJwt = ({
  oid = randomUUID(),
  iss = 'test',
  email = casual.email,
  scopes = ['Admin'],
  roles = [],
}: Partial<BuildJwtInput> = {}): JwtPayload => ({
  oid,
  iss,
  email,
  scp: scopes.join(' '),
  roles,
})

export const buildUser = (jwt: JwtPayload = buildJwt()) => new User(jwt, '')

export const createContext = async ({ user }: { user?: User }): Promise<GraphQLContext> => {
  const context = { user, logger, requestInfo, started: Date.now(), dataSource }
  return { ...context, services: createServices(context) }
}
