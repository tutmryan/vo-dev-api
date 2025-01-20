import type { RouterContext } from '@koa/router'
import { millisecondsInHour } from 'date-fns/constants'
import type { JWTPayload, KeyLike } from 'jose'
import { createRemoteJWKSet, decodeJwt, decodeProtectedHeader, jwtVerify } from 'jose'
import type { Configuration, OIDCContext, UnknownObject, Provider } from 'oidc-provider'
import { eamFriendlyTenants } from '../../../config'
import { dataSource } from '../../../data'
import type { ClaimConstraint } from '../../../generated/graphql'
import { logger } from '../../../logger'
import { invariant } from '../../../util/invariant'
import { throwError } from '../../../util/throw-error'
import { IdentityEntity } from '../../identity/entities/identity-entity'
import { paramsToAuthParamsSpec, wrapOidcPipelineStep } from '../integration-hook'
import { oauthErrors } from '../oauth'
import { getData, oidcProviderModule } from '../provider'
import type { LoginInteractionData } from '../session'
import { getLoginInteractionData, setLoginInteractionData } from '../session'

enum ExtraParams {
  clientRequestId = 'client-request-id',
}

export const eamExtraParams: Configuration['extraParams'] = {
  async [ExtraParams.clientRequestId](ctx, value, _client) {
    if (ctx.oidc.params) ctx.oidc.params[ExtraParams.clientRequestId] = value
  },
}

const isMsLoginUri = (uri: string) =>
  uri.startsWith('https://login.microsoftonline.com') || // MS Azure
  uri.startsWith('https://login.microsoftonline.us') || // MS Azure - Government
  uri.startsWith('https://login.partner.microsoftonline.cn') // MS Azure - China

const mapMsLoginToAzureJwksUri = (uri: string) => {
  // MS Azure
  if (uri.startsWith('https://login.microsoftonline.com')) return 'https://login.microsoftonline.com/common/discovery/v2.0/keys'
  // MS Azure - Government
  if (uri.startsWith('https://login.microsoftonline.us')) return 'https://login.microsoftonline.us/common/discovery/v2.0/keys'
  // MS Azure - China
  if (uri.startsWith('https://login.partner.microsoftonline.cn'))
    return 'https://login.partner.microsoftonline.cn/common/discovery/v2.0/keys'
  return undefined
}

const extractLoggable = (params: UnknownObject) => {
  return {
    clientRequestId: params[ExtraParams.clientRequestId],
    idTokenHint: params.id_token_hint,
    redirectUri: params.redirect_uri,
    responseMode: params.response_mode,
    responseType: params.response_type,
    scope: params.scope,
  }
}

const eamPresentationLoginStandardClaims = {
  // Note: EAM only allows a single amr value
  amr: ['pop'],
  // Note: sending only 'possession' as the acr value does not work
  acr: 'possessionorinherence',
} as const

export function whenEamAddPresentationConstraints(loginData?: LoginInteractionData, constraints?: ClaimConstraint[]) {
  // Ignore non-EAM requests
  if (!loginData?.integrations?.entraEam) return constraints

  invariant(loginData.integrations.entraEam.identityId, 'Identity ID not found during EAM identity constraint build')

  return [
    ...(constraints ?? []),
    {
      claimName: 'identityId',
      values: [loginData.integrations.entraEam.identityId],
    },
  ]
}

export function whenEamGetAccountId(loginData?: LoginInteractionData) {
  // Ignore non-EAM requests
  if (!loginData?.integrations?.entraEam) return undefined

  return loginData.integrations.entraEam.sub
}

export function isEamRequestAndLoginShouldFail(loginData?: LoginInteractionData) {
  // Ignore non-EAM requests
  if (!loginData?.integrations?.entraEam) return false

  // Fail the login if the identity ID is not set
  return loginData.integrations.entraEam.identityId === undefined
}

export const eamLoginFailResult = {
  error: oauthErrors.accessDenied,
  error_description: 'No identity could be matched to the Entra user.',
}

export function whenEamApplyAmr(loginData: LoginInteractionData, amr: string[]) {
  // Ignore non-EAM requests
  if (!loginData.integrations?.entraEam) return amr

  return [...eamPresentationLoginStandardClaims.amr]
}

export function whenEamApplyAcr(loginData: LoginInteractionData, acr: string) {
  // Ignore non-EAM requests
  if (!loginData.integrations?.entraEam) return acr

  return eamPresentationLoginStandardClaims.acr as string
}

export const isEamRequest = (params: UnknownObject, clientId: string) => {
  // Confirm the basic OIDC parameters line up with expected EAM values
  if (
    params.scope !== 'openid' ||
    params.response_type !== 'id_token' ||
    params.response_mode !== 'form_post' ||
    !params.id_token_hint ||
    !params.nonce ||
    !params.state
  )
    return false

  // Confirm the EAM specific parameters
  // Client request ID is used by Entra to track login activity
  if (!params[ExtraParams.clientRequestId]) return false

  // Confirm the redirect URI is a valid MS login URI
  if (mapMsLoginToAzureJwksUri((params.redirect_uri as string | undefined) ?? '') === undefined) return false

  const decodedIdTokenHint = decodeJwt(params.id_token_hint as string)

  // Confirm the EAM specific parameters (Object ID, Tenant ID, and Issuer)
  if (!decodedIdTokenHint.oid || !decodedIdTokenHint.tid || !isMsLoginUri(decodedIdTokenHint.iss ?? '')) return false

  // As this token wasn't issued by the client (us), the aud should not match the client ID
  // MS Docs say the value they send is the client ID registered in EAM, which is actually the spec (if we had issued it). However, the App ID registered for EAM is supplied in practice.
  if (decodedIdTokenHint.aud === clientId) return false

  // It is extremely unlikely that this is not an EAM request at this point. And if it isn't, it's an invalid request so breaking it by assuming it is EAM is fine
  return true
}

// Cache the Entra keys in memory
const inMemoryKeySetCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>()

export const hookAndApplyCustomEntraEamSpec = (provider: Provider) => {
  // Override the authorization -> checkIdTokenHint pipeline step to apply custom logic for EAM requests
  wrapOidcPipelineStep(provider, 'authorization', ['POST'], 'checkIdTokenHint', async (ctx, next, original) => {
    const { oidc } = ctx as RouterContext & { oidc: OIDCContext }
    const { clients } = getData()
    const { errors } = await oidcProviderModule()

    if (!oidc.client?.clientId) {
      logger.error(`Client ID not found in the OIDC context`, { params: extractLoggable(oidc.params!) })
      throw new errors.InvalidClient('Client not found')
    }

    const clientId = oidc.client.clientId.toLowerCase()
    const client = clients.find((c) => c.id.toLowerCase() === clientId)

    if (!client) {
      logger.error(`Client ID could not be matched to a known client`, { params: extractLoggable(oidc.params!) })
      throw new errors.InvalidClient('Client not found')
    }

    // Don't intercept non-EAM requests
    if (!isEamRequest(oidc.params!, clientId)) {
      return original(ctx, next)
    }

    const authParams = paramsToAuthParamsSpec(oidc.params!, errors)
    const decodedProtectedHeader = decodeProtectedHeader(authParams.id_token_hint!)
    const decodedIdTokenHint = decodeJwt(authParams.id_token_hint!)

    if (!decodedProtectedHeader.alg) {
      logger.error(`id_token_hint does not contain an alg header`, { params: extractLoggable(oidc.params!) })
      throw new errors.InvalidRequest('id_token_hint does not contain an alg header')
    }

    const tenantId = eamFriendlyTenants.find((tid) => tid.toLowerCase() === decodedIdTokenHint.tid)
    if (!tenantId) {
      logger.error(`Tenant ID not found in the authTenantIds`, { params: extractLoggable(oidc.params!) })
      throw new errors.InvalidRequest('Tenant ID is not registered for use with this instance of VO.')
    }

    const jwksUri = mapMsLoginToAzureJwksUri(authParams.redirect_uri)!
    if (!inMemoryKeySetCache.has(jwksUri)) {
      inMemoryKeySetCache.set(
        jwksUri,
        createRemoteJWKSet(new URL(jwksUri), {
          // The default is 10 minutes, however that's a little short for the EAM use-case.
          // Given the MS advice is to refresh hourly, and that this is an MS OIDC implementation, we'll use an hour.
          // https://learn.microsoft.com/en-us/entra/identity-platform/signing-key-rollover#general-considerations
          cacheMaxAge: millisecondsInHour,
        }),
      )
    }

    const { payload, protectedHeader } = await jwtVerify<JWTPayload, KeyLike>(authParams.id_token_hint!, inMemoryKeySetCache.get(jwksUri)!)
    oidc.entity('IdTokenHint', { payload, header: protectedHeader })

    // Although the VO OIDC provider is session-less, we'll force the prompt here.
    // This ensures the implementation is accurate to a standard EAM flow,
    const { prompts } = oidc // Do not inline, as this is a getter and a new instance is created each time
    if (!prompts.has('login')) {
      prompts.add('login')
      oidc.params!.prompt = [...prompts].join(' ')
    }

    return next()
  })

  // Override the authorization -> interactions pipeline step to save the EAM sub and state to the interaction data
  wrapOidcPipelineStep(provider, 'authorization', ['POST'], 'interactions', async (ctx, next, original) => {
    const { oidc } = ctx as RouterContext & { oidc: OIDCContext }
    const { errors } = await oidcProviderModule()

    if (!oidc.client?.clientId) {
      logger.error(`Client ID not found in the OIDC context`, { params: extractLoggable(oidc.params!) })
      throw new errors.InvalidClient('Client not found')
    }

    // Don't intercept non-EAM requests
    if (!isEamRequest(oidc.params!, oidc.client.clientId)) {
      return original(ctx, next)
    }

    // This intercept is a special case, because the provider doesn't call next if the interaction is started
    await original(ctx, next)

    // Started interactions will redirect, so if we're not redirecting, we should not apply the custom logic
    if (ctx.response.status !== 303) {
      logger.warn(`Interactions pipeline step did not redirect`, { params: extractLoggable(oidc.params!) })
      return
    }

    invariant(oidc.entities.Interaction, 'Interaction entity not found post interactions during EAM auth flow')
    const interactionData = await getLoginInteractionData(oidc.entities.Interaction.uid)
    if (interactionData) invariant(interactionData.state !== 'pre-start', 'Interaction data was in an incorrect state for EAM auth flow')

    invariant(oidc.entities.IdTokenHint, 'IdTokenHint entity not found post interactions event during EAM auth flow')
    const objectId = (oidc.entities.IdTokenHint.payload.oid as string | undefined) ?? ''
    const tenantId = (oidc.entities.IdTokenHint.payload.tid as string | undefined) ?? ''

    invariant(objectId && tenantId, 'Both oid and tid are required to be present in the id_token_hint during an EAM flow')
    const identity = await dataSource.getRepository(IdentityEntity).findOne({
      where: {
        identifier: objectId,
        issuer: tenantId,
      },
    })

    invariant(oidc.params, 'Params not found post interactions')

    await setLoginInteractionData({
      ...(interactionData ?? {}),
      interactionId: oidc.entities.Interaction.uid,
      state: 'pre-start',
      integrations: {
        entraEam: {
          sub:
            (oidc.entities.IdTokenHint.payload.sub as string | undefined) ??
            throwError('sub not found in IdTokenHint during EAM auth flow'),
          iss:
            (oidc.entities.IdTokenHint.payload.iss as string | undefined) ??
            throwError('iss not found in IdTokenHint during EAM auth flow'),
          state: (oidc.params.state as string | undefined) ?? throwError('state not found in params during EAM auth flow'),
          nonce: (oidc.params.nonce as string | undefined) ?? throwError('nonce not found in params during EAM auth flow'),
          clientRequestId:
            (oidc.params[ExtraParams.clientRequestId] as string | undefined) ??
            throwError('client_request_id not found in params during EAM auth flow'),
          identityId: identity?.id,
        },
      },
    })
  })
}
