import type { JwtPayload, RequestInfo } from '@makerx/graphql-core'
import casual from 'casual'
import { randomUUID } from 'crypto'
import { apiUrl, oidcAuthorityUrl } from '../config'
import type { GraphQLContext } from '../context'
import { findUpdateOrCreateUser, findUpdateOrCreateUserEntity } from '../context'
import { dataSource } from '../data'
import type { AsyncIssuanceSessionData } from '../features/async-issuance/session'
import { setAsyncIssuanceSessionData } from '../features/async-issuance/session'
import { setLimitedAccessData } from '../features/limited-access-tokens'
import { createLimitedPhotoCaptureSession } from '../features/limited-photo-capture-tokens'
import { setLimitedPresentationFlowTokenData, type LimitedPresentationFlowTokenData } from '../features/limited-presentation-flow-tokens'
import { VoIdentityClaim } from '../features/oidc-provider/claims'
import { setPhotoCaptureData, type PhotoCaptureData } from '../features/photo-capture'
import type { AcquireLimitedAccessTokenInput } from '../generated/graphql'
import { createDataLoaders } from '../loaders'
import { logger } from '../logger'
import { OidcScopes } from '../roles'
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

export function buildIssueeJwt(identityId: string) {
  return {
    ...buildJwt({ scopes: [OidcScopes.issuee] }),
    iss: oidcAuthorityUrl,
    aud: apiUrl,
    [VoIdentityClaim.IdentityId]: identityId,
  }
}

export type LimitedPresentationFlowOperationInput = PartialBy<LimitedPresentationFlowTokenData, 'userId'>
export type LimitedPhotoCaptureOperationInput = PartialBy<PhotoCaptureData, 'userId'> & { disableSession?: boolean }

export const createContext = async (
  jwtPayload?: JwtPayload,
  limitedAccessInput?: AcquireLimitedAccessTokenInput,
  limitedPresentationFlowInput?: LimitedPresentationFlowOperationInput,
  limitedPhotoCaptureData?: LimitedPhotoCaptureOperationInput,
  limitedAsyncIssuanceData?: AsyncIssuanceSessionData,
): Promise<GraphQLContext> => {
  // create a user
  const token = randomUUID()

  // limited access and limited presentation flow data injection
  if (limitedAccessInput || limitedPresentationFlowInput || limitedPhotoCaptureData || limitedAsyncIssuanceData) {
    const userEntity = await findUpdateOrCreateUserEntity(jwtPayload!)
    if (limitedAccessInput) await setLimitedAccessData(token, Object.assign({ userId: userEntity.id }, limitedAccessInput))
    if (limitedPresentationFlowInput)
      await setLimitedPresentationFlowTokenData(token, Object.assign({ userId: userEntity.id }, limitedPresentationFlowInput))
    if (limitedPhotoCaptureData) {
      await setPhotoCaptureData(
        limitedPhotoCaptureData.photoCaptureRequestId,
        Object.assign({ userId: userEntity.id }, limitedPhotoCaptureData),
      )
      await createLimitedPhotoCaptureSession(token, limitedPhotoCaptureData.photoCaptureRequestId)
    }
    if (limitedAsyncIssuanceData) await setAsyncIssuanceSessionData(token, limitedAsyncIssuanceData)
  }

  // create the context
  const user = await findUpdateOrCreateUser(jwtPayload, token)
  const context = { user, logger: logger.child({}), requestInfo, started: Date.now(), dataSource }
  const services = createServices(context)
  const dataLoaders = createDataLoaders(services)
  return { ...context, services, dataLoaders }
}
