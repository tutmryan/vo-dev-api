import type { JwtPayload, RequestInfo } from '@makerx/graphql-core'
import casual from 'casual'
import { randomUUID } from 'crypto'
import type { GraphQLContext } from '../context'
import { findUpdateOrCreateUser } from '../context'
import { dataSource } from '../data'
import { setLimitedAccessData } from '../features/limited-access-tokens'
import type { AcquireLimitedAccessTokenInput } from '../generated/graphql'
import { createDataLoaders } from '../loaders'
import { logger } from '../logger'
import { createServices } from '../services'

const requestInfo: RequestInfo = {
  protocol: 'http',
  host: 'localhost',
  url: 'http://localhost/graphql',
  method: 'TEST',
  origin: 'jest',
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
  scopes = [],
  roles = [],
}: Partial<BuildJwtInput> = {}): JwtPayload => ({
  oid,
  tid,
  sub,
  email,
  scp: scopes.join(' '),
  roles,
})

export const createContext = async (
  jwtPayload?: JwtPayload,
  limitedAccessData?: AcquireLimitedAccessTokenInput,
): Promise<GraphQLContext> => {
  const token = randomUUID()
  if (limitedAccessData) await setLimitedAccessData(token, limitedAccessData)
  const user = await findUpdateOrCreateUser(jwtPayload, token)
  const context = { user, logger, requestInfo, started: Date.now(), dataSource }
  return { ...context, services: createServices(context), dataLoaders: createDataLoaders() }
}
