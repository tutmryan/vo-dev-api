import type { Configuration, UnknownObject } from 'oidc-provider'
import type { VerifiedOrchestrationEntity } from '../../data/verified-orchestration-entity'
import { logger } from '../../logger'
import { renderFile } from 'ejs'
import path from 'path'
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
    keyof AuditedAndTrackedEntity | keyof VerifiedOrchestrationEntity | 'partners' | 'partnerIds' | 'resources' | 'update' | 'redirectUris'
  >
>

export const errorHandler: Configuration['renderError'] = async (ctx, errorOut, error) => {
  logger.error('OIDC provider error', { error, oidcParams: processOidcParams(ctx.oidc.params) })
  const clientId = ctx.oidc.params?.client_id as string | undefined
  const clientEntity = clientId ? getClient(clientId) : minimalClientEntity
  const { logo, backgroundColor, backgroundImage } = clientEntity
  ctx.response.body = await renderFile(path.join(__dirname, 'views', 'error.ejs'), {
    error,
    errorOut,
    client: clientEntity,
    voLogoUrl,
    logoUrl: logo,
    backgroundColor,
    backgroundImageUrl: backgroundImage,
  })
}
