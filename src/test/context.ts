import type { JwtPayload, RequestInfo } from '@makerx/graphql-core'
import casual from 'casual'
import { randomUUID } from 'crypto'
import type { GraphQLContext } from '../context'
import { findUpdateOrCreateUser, findUpdateOrCreateUserEntity } from '../context'
import { dataSource } from '../data'
import { setLimitedAccessData } from '../features/limited-access-tokens'
import type { LimitedApprovalData } from '../features/limited-approval-tokens'
import { setLimitedApprovalData } from '../features/limited-approval-tokens'
import { createLimitedPhotoCaptureSession } from '../features/limited-photo-capture-tokens'
import { setPhotoCaptureData, type PhotoCaptureData } from '../features/photo-capture'
import type { AcquireLimitedAccessTokenInput } from '../generated/graphql'
import { createDataLoaders } from '../loaders'
import { logger } from '../logger'
import { createServices } from '../services'
import type { PartialBy } from '../util/partial-by'

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

export type LimitedApprovalOperationInput = PartialBy<LimitedApprovalData, 'userId'>
export type LimitedPhotoCaptureOperationInput = PartialBy<PhotoCaptureData, 'userId'> & { disableSession?: boolean }

export const createContext = async (
  jwtPayload?: JwtPayload,
  limitedAccessInput?: AcquireLimitedAccessTokenInput,
  limitedApprovalInput?: LimitedApprovalOperationInput,
  limitedPhotoCaptureData?: LimitedPhotoCaptureOperationInput,
): Promise<GraphQLContext> => {
  // create a user
  const token = randomUUID()

  // limited access and limited approval data injection
  if (limitedAccessInput || limitedApprovalInput || limitedPhotoCaptureData) {
    const userEntity = await findUpdateOrCreateUserEntity(jwtPayload!)
    if (limitedAccessInput) await setLimitedAccessData(token, Object.assign({ userId: userEntity.id }, limitedAccessInput))
    if (limitedApprovalInput) await setLimitedApprovalData(token, Object.assign({ userId: userEntity.id }, limitedApprovalInput))
    if (limitedPhotoCaptureData) {
      await setPhotoCaptureData(
        limitedPhotoCaptureData.photoCaptureRequestId,
        Object.assign({ userId: userEntity.id }, limitedPhotoCaptureData),
      )
      await createLimitedPhotoCaptureSession(token, limitedPhotoCaptureData.photoCaptureRequestId)
    }
  }

  // create the context
  const user = await findUpdateOrCreateUser(jwtPayload, token)
  const context = { user, logger, requestInfo, started: Date.now(), dataSource }
  return { ...context, services: createServices(context), dataLoaders: createDataLoaders() }
}
