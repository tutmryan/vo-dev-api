import type { JwtPayload, RequestInfo } from '@makerxstudio/graphql-core'
import casual from 'casual'
import { randomUUID } from 'crypto'
import type { Request } from 'express'
import type { GraphQLContext } from '../context'
import { findUpdateOrCreateUser } from '../context'
import { dataSource } from '../data'
import { createDataLoaders } from '../loaders'
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
  tid: string
  sub: string
  email: string
  scopes: string[]
  roles: string[]
}

export const buildJwt = ({
  oid = randomUUID(),
  tid = randomUUID(),
  sub = randomUUID(),
  email = casual.email,
  scopes = ['Admin'],
  roles = [],
}: Partial<BuildJwtInput> = {}): JwtPayload => ({
  oid,
  tid,
  sub,
  email,
  scp: scopes.join(' '),
  roles,
})

export const createContext = async (jwtPayload?: JwtPayload): Promise<GraphQLContext> => {
  const user = await findUpdateOrCreateUser({ claims: jwtPayload, req: <Request>{ headers: { authorization: 'Bearer test' } } })
  const context = { user, logger, requestInfo, started: Date.now(), dataSource }
  return { ...context, services: createServices(context), dataLoaders: createDataLoaders() }
}
