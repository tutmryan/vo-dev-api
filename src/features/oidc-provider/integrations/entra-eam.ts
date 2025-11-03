import { verifyMultiIssuer } from '@makerx/express-bearer'
import { decodeJwt, decodeProtectedHeader } from 'jose'
import type { AuthoriseResponse, Configuration, Errors, KoaContextWithOIDC, Provider, UnknownObject } from 'oidc-provider'
import { dataSource } from '../../../data'
import type { ClaimConstraint, PresentedCredential } from '../../../generated/graphql'
import { type Logger } from '../../../logger'
import { invariant } from '../../../util/invariant'
import { redactValueEmail, redactValueInner, redactValueObjectUnknown } from '../../../util/redact-values'
import { compareIgnoreCase } from '../../../util/string'
import { throwError } from '../../../util/throw-error'
import { StandardClaims } from '../../contracts/claims'
import { IdentityEntity } from '../../identity/entities/identity-entity'
import { getEamIssuerOptions } from '../../instance-configs'
import { supportedAmrs } from '../claims'
import { filterToRequestedClaimsAcr, filterToRequestedClaimsAmr } from '../claims-parameter'
import { type ApplyIntercept, type ApplyPostIntercept, type RouterContextWithOIDC } from '../integration-hook'
import { buildRequestLogger } from '../logger'
import { oauthErrors } from '../oauth'
import { oidcProviderModule } from '../provider'
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

const paramsToAuthParamsSpec = (params: Record<string, unknown>, errors: Errors, logger: Logger) => {
  const requiredString = (key: string) => {
    if (!params[key] || typeof params[key] !== 'string') {
      logger.error(`Missing required parameter: ${key}`)
      throw new errors.InvalidRequest(`Missing required parameter: ${key}`)
    }
    return params[key]
  }
  const optionalString = (key: string) => {
    return params[key] as string | undefined
  }
  return {
    scope: requiredString('scope'),
    response_type: requiredString('response_type'),
    client_id: requiredString('client_id'),
    redirect_uri: requiredString('redirect_uri'),
    state: optionalString('state'),
    response_mode: optionalString('response_mode'),
    nonce: optionalString('nonce'),
    display: optionalString('display'),
    prompt: optionalString('prompt'),
    max_age: optionalString('max_age'),
    ui_locales: optionalString('ui_locales'),
    id_token_hint: optionalString('id_token_hint'),
    login_hint: optionalString('login_hint'),
    acr_values: optionalString('acr_values'),
  }
}

const extractLoggable = (params: UnknownObject, idTokenHint?: { header: UnknownObject; payload: UnknownObject }) => {
  const redactedIdTokenHint = idTokenHint
    ? {
        ...redactValueObjectUnknown(idTokenHint.payload),
        name: idTokenHint.payload.name && redactValueInner(idTokenHint.payload.name),
        preferred_username: idTokenHint.payload.preferred_username && redactValueEmail(idTokenHint.payload.preferred_username),
      }
    : undefined

  return {
    clientRequestId: params[ExtraParams.clientRequestId],
    idTokenHint: redactedIdTokenHint,
    redirectUri: params.redirect_uri,
    responseMode: params.response_mode,
    responseType: params.response_type,
    scope: params.scope,
    claims: params.claims,
  }
}

export function addEamPresentationConstraints(loginData: LoginInteractionData, constraints: ClaimConstraint[] | undefined, logger: Logger) {
  invariant(loginData.integrations?.entraEam, 'EAM integration not found during constraint build')
  invariant(loginData.integrations.entraEam.identityId, 'Identity ID not found during EAM identity constraint build')

  const augmentedConstraints = [
    ...(constraints ?? []),
    {
      claimName: StandardClaims.identityId,
      values: [loginData.integrations.entraEam.identityId],
    },
  ]

  logger.info('OIDC EAM hook:addEamPresentationConstraints augmenting constraints', {
    augmentedConstraints: augmentedConstraints.reduce(
      (acc, constraint) => {
        acc[constraint.claimName] =
          constraint.claimName !== StandardClaims.identityId ? redactValueInner(constraint.values?.[0]) : constraint.values?.[0]
        return acc
      },
      {} as Record<string, string | undefined>,
    ),
  })

  return augmentedConstraints
}

export function getEamAccountId(loginData: LoginInteractionData, credential: PresentedCredential, logger: Logger) {
  invariant(loginData.integrations?.entraEam, 'EAM integration not found during constraint build')
  invariant(
    compareIgnoreCase(credential.claims[StandardClaims.identityId], loginData.integrations.entraEam.identityId),
    'Identity ID mismatch during EAM OIDC account ID check',
  )

  logger.info('OIDC EAM hook:getEamAccountId account Id', {
    issuanceId: credential.claims[StandardClaims.issuanceId],
    identityId: loginData.integrations.entraEam.identityId,
    accountId: redactValueInner(loginData.integrations.entraEam.sub),
  })
  return loginData.integrations.entraEam.sub
}

export function isEamRequestAndLoginShouldFail(loginData: LoginInteractionData | undefined, logger: Logger) {
  // Ignore non-EAM requests
  if (!loginData?.integrations?.entraEam) {
    logger.verbose('OIDC EAM hook:isEamRequestAndLoginShouldFail skipping non-EAM request')
    return false
  }

  // Fail the login if the identity ID is not set
  if (loginData.integrations.entraEam.identityId === undefined) {
    logger.warn('OIDC EAM hook:isEamRequestAndLoginShouldFail identity ID not set. Most likely due to an incorrectly configured identity', {
      result: 'fail',
    })
    return true
  }
  logger.info('OIDC EAM hook:isEamRequestAndLoginShouldFail identity ID is set', { result: 'pass' })
  return false
}

export const eamLoginFailResult = {
  error: oauthErrors.accessDenied,
  error_description: 'No identity could be matched to the Entra user.',
}

export function getEamAmr(loginData: LoginInteractionData, logger: Logger): string[] {
  // Entra will typically request ["face","fido","fpt","hwk","iris","otp","tel","pop","retina","sc","sms","swk","vbm","bio"]
  const amr = filterToRequestedClaimsAmr([...supportedAmrs], loginData.requestedClaims!)

  invariant(amr.length > 0, 'No amr values post-filter')
  logger.info('OIDC EAM hook:whenEamApplyAmr', { amr })
  return [amr[0]!] // Entra only allows a single amr value, so we return an array with a single value.
}

export function getEamAcr(loginData: LoginInteractionData, logger: Logger): string {
  // Entra will typically request ["possessionorinherence"], but it can also request other acr values. (AS WE FOUND OUT!)
  const acr = filterToRequestedClaimsAcr('possessionorinherence', loginData.requestedClaims!)
  logger.info('OIDC EAM hook:getEamAcr', { acr })
  return acr
}

export const isEamRequest = (params: UnknownObject, clientId: string, logger: Logger) => {
  // Confirm the basic OIDC parameters line up with expected EAM values
  if (
    !((params.scope as string | undefined) ?? '').includes('openid') ||
    params.response_type !== 'id_token' ||
    params.response_mode !== 'form_post' ||
    !params.id_token_hint ||
    !params.nonce ||
    !params.state ||
    !params.claims
  ) {
    logger.info('OIDC EAM hook:isEamRequest skipping non-EAM request due mismatch with expected parameters', {
      params: extractLoggable(params),
    })
    return false
  }

  const decodedIdTokenHint = decodeJwt<{ oid: string; tid: string }>(params.id_token_hint as string)

  // Confirm the EAM specific parameters
  // Client request ID is used by Entra to track login activity
  if (!params[ExtraParams.clientRequestId]) {
    logger.info('OIDC EAM hook:isEamRequest skipping non-EAM request due to missing client request ID', {
      params: extractLoggable(params, { header: {}, payload: decodedIdTokenHint }),
    })
    return false
  }

  // Confirm the redirect URI is a valid MS login URI
  if (mapMsLoginToAzureJwksUri((params.redirect_uri as string | undefined) ?? '') === undefined) {
    logger.warn('OIDC EAM hook:isEamRequest skipping non-EAM request due to redirect URI not being a valid MS login URI', {
      params: extractLoggable(params, { header: {}, payload: decodedIdTokenHint }),
    })
    return false
  }

  // Confirm the EAM specific parameters (Object ID, Tenant ID, and Issuer)
  if (!decodedIdTokenHint.oid || !decodedIdTokenHint.tid || !isMsLoginUri(decodedIdTokenHint.iss ?? '')) {
    logger.warn('OIDC EAM hook:isEamRequest skipping non-EAM request due to missing EAM specific parameters (oid, tid, iss)', {
      params: extractLoggable(params, { header: {}, payload: decodedIdTokenHint }),
    })
    return false
  }

  // As this token wasn't issued by the client (us), the aud should not match the client ID
  // MS Docs say the value they send is the client ID registered in EAM, which is actually the spec (if we had issued it). However, the App ID registered for EAM is supplied in practice.
  if (compareIgnoreCase(decodedIdTokenHint.aud, clientId)) {
    logger.warn('OIDC EAM hook:isEamRequest skipping non-EAM request due to aud not matching client ID', {
      params: extractLoggable(params, { header: {}, payload: decodedIdTokenHint }),
    })
    return false
  }

  // It is extremely unlikely that this is not an EAM request at this point. And if it isn't, it's an invalid request so breaking it by assuming it is EAM is fine
  logger.info('OIDC EAM hook:isEamRequest processing EAM request', {
    params: extractLoggable(params, { header: {}, payload: decodedIdTokenHint }),
  })
  return true
}

export const isEamCheckIdTokenIntercept = async (ctx: RouterContextWithOIDC) => {
  if (ctx.method !== 'POST') {
    return false
  }

  const { oidc } = ctx
  const { errors } = await oidcProviderModule()
  const logger = buildRequestLogger(ctx.request)

  if (!oidc.client?.clientId) {
    logger.error(`OIDC EAM hook:isEamCheckIdTokenIntercept Client ID not found in the OIDC context`, {
      params: extractLoggable(oidc.params!),
    })
    throw new errors.InvalidClient('Client not found')
  }

  return isEamRequest(oidc.params!, oidc.client.clientId, logger)
}

export const applyEamCheckIdTokenHook: ApplyIntercept = async (ctx, next, _original) => {
  const { oidc } = ctx
  const { errors } = await oidcProviderModule()
  const logger = buildRequestLogger(ctx.request)
  const authParams = paramsToAuthParamsSpec(oidc.params!, errors, logger)
  const decodedProtectedHeader = decodeProtectedHeader(authParams.id_token_hint!)

  if (!decodedProtectedHeader.alg) {
    logger.error(`OIDC EAM hook:applyEamCheckIdTokenHook id_token_hint does not contain an alg header`, {
      params: extractLoggable(oidc.params!),
    })
    throw new errors.InvalidRequest('id_token_hint does not contain an alg header')
  }

  try {
    const payload = await verifyMultiIssuer(ctx.host, authParams.id_token_hint!, {
      issuerOptions: getEamIssuerOptions(),
      explicitNoAudienceValidation: true,
    })
    oidc.entity('IdTokenHint', { payload, header: decodeProtectedHeader })
  } catch (err) {
    logger.error(`OIDC EAM hook:applyEamCheckIdTokenHook id_token_hint could not be verified`, {
      err,
      params: extractLoggable(oidc.params!),
    })
    throw new errors.AccessDenied('id_token_hint could not be verified')
  }

  // Although the VO OIDC provider is session-less, we'll force the prompt here.
  // This ensures the implementation is accurate to a standard EAM flow,
  const { prompts } = oidc // Do not inline, as this is a getter and a new instance is created each time
  if (!prompts.has('login')) {
    prompts.add('login')
    oidc.params!.prompt = [...prompts].join(' ')
  }

  logger.verbose(`OIDC EAM hook:applyEamCheckIdTokenHook intercept end`, {
    params: extractLoggable(oidc.params!, oidc.entities.IdTokenHint),
  })

  // Note: we don't call the original step here, as we want to override it completely.
  return next()
}

export const isEamInteractionsIntercept = isEamCheckIdTokenIntercept

export const applyEamInteractionsHook: ApplyPostIntercept = async (ctx) => {
  const { oidc } = ctx
  const logger = buildRequestLogger(ctx.request)

  // Started interactions will redirect, so if we're not redirecting, we should not apply the custom logic
  if (ctx.response.status !== 303) {
    logger.warn(`OIDC EAM hook:applyEamInteractionsHook Interactions pipeline step did not redirect`, {
      params: extractLoggable(oidc.params!, oidc.entities.IdTokenHint),
    })
    return
  }

  invariant(oidc.entities.Interaction, 'Interaction entity not found post interactions during EAM auth flow')
  const interactionData = await getLoginInteractionData(oidc.entities.Interaction.uid)
  if (interactionData) invariant(interactionData.state === 'pre-start', 'Interaction data was in an incorrect state for EAM auth flow')

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

  if (!identity) {
    logger.warn('OIDC EAM hook:applyEamInteractionsHook identity could be matched during a EAM auth flow', {
      params: extractLoggable(oidc.params!, oidc.entities.IdTokenHint),
    })
  }

  invariant(oidc.params, 'Params not found post interactions')

  await setLoginInteractionData({
    ...(interactionData ?? {}),
    interactionId: oidc.entities.Interaction.uid,
    state: 'pre-start',
    integrations: {
      entraEam: {
        sub:
          (oidc.entities.IdTokenHint.payload.sub as string | undefined) ?? throwError('sub not found in IdTokenHint during EAM auth flow'),
        identityId: identity?.id,
      },
    },
  })

  if (logger.isVerboseEnabled()) {
    logger.verbose('OIDC EAM hook:applyEamInteractionsHook intercept end', {
      preInteractionData: redactValueObjectUnknown(interactionData ?? {}),
      postInteractionData: redactValueObjectUnknown((await getLoginInteractionData(oidc.entities.Interaction.uid)) ?? {}),
      identity: { id: identity?.id, name: redactValueInner(identity?.name) },
      params: extractLoggable(oidc.params!),
    })
  }
}

export const registerEamEventListeners = (provider: Provider) => {
  provider.on('authorization.success', (ctx: KoaContextWithOIDC, response: AuthoriseResponse) => {
    const { oidc } = ctx
    const logger = buildRequestLogger(ctx.request)

    invariant(oidc.client?.clientId, 'Client not found in OIDC context during EAM auth flow')

    // Don't intercept non-EAM requests
    if (!isEamRequest(oidc.params!, oidc.client.clientId, logger)) {
      logger.verbose('OIDC EAM hook:event:authorization.success skipping non-EAM request')
      return
    }

    invariant(response.id_token, 'id_token not found in response during EAM auth flow')
    const idTokenDecoded = decodeJwt(response.id_token)

    const logMetadata: Record<string, any> = {
      response: { id_token: redactValueObjectUnknown(idTokenDecoded) },
      params: extractLoggable(oidc.params!),
    }
    logger.info('OIDC EAM hook:event:authorization.success intercept end', logMetadata)
  })
}
