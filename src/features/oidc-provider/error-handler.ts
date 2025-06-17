import { isLocalDev } from '@makerx/node-common'
import { renderFile } from 'ejs'
import type { Configuration, UnknownObject } from 'oidc-provider'
import path from 'path'
import { instance } from '../../config'
import type { VerifiedOrchestrationEntity } from '../../data/verified-orchestration-entity'
import { logger } from '../../logger'
import type { AuditedAndTrackedEntity } from '../auditing/entities/audited-and-tracked-entity'
import type { OidcClientEntity } from './entities/oidc-client-entity'
import { voLogoUrl } from './logos'
import { getClient } from './provider'

const processOidcParams = (oidcParams: UnknownObject | undefined) => {
  if (!oidcParams) return {}
  // Removes all falsy values from the object
  return Object.fromEntries(Object.entries(oidcParams).filter(([_k, v]) => v))
}

const minimalClientEntity = {
  name: '',
  logo: null,
  backgroundColor: null,
  backgroundImage: null,
  policyUrl: null,
  termsOfServiceUrl: null,
  applicationType: null,
  requireFaceCheck: false,
  allowAnyPartner: false,
  postLogoutUris: [],
  uniqueClaimsForSubjectId: null,
  credentialTypes: null,
  deletedAt: null,
} satisfies Pick<
  OidcClientEntity,
  keyof Omit<
    OidcClientEntity,
    | keyof AuditedAndTrackedEntity
    | keyof VerifiedOrchestrationEntity
    | 'partners'
    | 'partnerIds'
    | 'resources'
    | 'update'
    | 'redirectUris'
    | 'claimMappings'
    | 'claimMappingIds'
  >
>

const tryGetClient = (clientId: string | undefined) => {
  if (!clientId) return minimalClientEntity
  try {
    return getClient(clientId)
  } catch {
    return minimalClientEntity
  }
}

export const errorHandler: Configuration['renderError'] = async (ctx, errorOut, error) => {
  logger.error('OIDC provider error', { error, oidcParams: processOidcParams(ctx.oidc.params) })
  const clientId = ctx.oidc.params?.client_id as string | undefined
  const clientEntity = tryGetClient(clientId)
  const { logo, backgroundColor, backgroundImage } = clientEntity
  ctx.response.body = await renderFile(path.join(__dirname, 'views', 'error.ejs'), {
    error,
    errorOut,
    client: clientEntity,
    voLogoUrl,
    logoUrl: logo,
    backgroundColor,
    backgroundImageUrl: backgroundImage,
    showDebug: isLocalDev || instance === 'dev',
  })
}
