import type { RouterContext } from '@koa/router'
import { verifyMultiIssuer } from '@makerx/express-bearer'
import { decodeJwt, decodeProtectedHeader } from 'jose'
import { pick } from 'lodash'
import type { Configuration, OIDCContext, Provider, UnknownObject } from 'oidc-provider'
import { eamIssuerOptions, instance } from '../../../config'
import { dataSource } from '../../../data'
import type { ClaimConstraint, PresentedCredential } from '../../../generated/graphql'
import { logger } from '../../../logger'
import { invariant } from '../../../util/invariant'
import { redactValueEmail, redactValueInner, redactValueObjectUnknown } from '../../../util/redact-values'
import { compareIgnoreCase } from '../../../util/string'
import { throwError } from '../../../util/throw-error'
import { StandardClaims } from '../../contracts/claims'
import { IdentityEntity } from '../../identity/entities/identity-entity'
import { paramsToAuthParamsSpec, wrapOidcPipelineStep } from '../integration-hook'
import { oauthErrors } from '../oauth'
import { oidcProviderModule } from '../provider'
import type { LoginInteractionData } from '../session'
import { getLoginInteractionData, setLoginInteractionData } from '../session'

const isNelnetOrDevInstance = instance && ['nelnet', 'sandbox.nelnet', 'dev'].includes(instance)

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
  }
}

const eamPresentationLoginStandardClaims = {
  // Note: EAM only allows a single amr value
  amr: ['pop'],
  // Note: sending only 'possession' as the acr value does not work
  /*
  | ACR                               | AMR    | result  | failure reason                                                                         |
  |-----------------------------------|--------|---------|----------------------------------------------------------------------------------------|
  | possessionorinherence             | pop    | success |                                                                                        |
  | possessionorinherence             | face   | success |                                                                                        |
  | possessionorinherence             | sms    | success |                                                                                        |
  | possessionorinherence             | swk    | success |                                                                                        |
  | possessionorinherence             | tel    | success |                                                                                        |
  | possessionorinherence             | retina | success |                                                                                        |
  | possessionorinherence             | fido   | success |                                                                                        |
  | possessionorinherence             | yeet   | fail    | AADSTS5001257: Failed to validate external id_token: 'amr' claim has unexpected value. |
  | knowledgeorpossession             | pop    | fail    | AADSTS5001258: Failed to validate external id_token: 'acr' claim has unexpected value. |
  | knowledgeorinherence              | pop    | fail    | AADSTS5001258: Failed to validate external id_token: 'acr' claim has unexpected value. |
  | knowledgeorpossessionorinherence  | pop    | fail    | AADSTS5001258: Failed to validate external id_token: 'acr' claim has unexpected value. |
  | knowledge                         | pop    | fail    | AADSTS5001258: Failed to validate external id_token: 'acr' claim has unexpected value. |
  | possession                        | pop    | fail    | AADSTS5001258: Failed to validate external id_token: 'acr' claim has unexpected value. |
  | inherence                         | pop    | fail    | AADSTS5001258: Failed to validate external id_token: 'acr' claim has unexpected value. |
  | knowledge                         | otp    | fail    | AADSTS5001258: Failed to validate external id_token: 'acr' claim has unexpected value. |
  | possession                        | hwk    | fail    | AADSTS5001258: Failed to validate external id_token: 'acr' claim has unexpected value. |
  | inherence                         | fpt    | fail    | AADSTS5001258: Failed to validate external id_token: 'acr' claim has unexpected value. |
  | inherence                         | iris   | fail    | AADSTS5001258: Failed to validate external id_token: 'acr' claim has unexpected value. |
   */
  acr: 'possessionorinherence',
} as const

export function whenEamAddPresentationConstraints(loginData?: LoginInteractionData, constraints?: ClaimConstraint[]) {
  // Ignore non-EAM requests
  if (!loginData?.integrations?.entraEam) {
    logger.verbose('OIDC EAM hook:whenEamAddPresentationConstraints skipping non-EAM request')
    return constraints
  }

  invariant(loginData.integrations.entraEam.identityId, 'Identity ID not found during EAM identity constraint build')

  const augmentedConstraints = [
    ...(constraints ?? []),
    {
      claimName: StandardClaims.identityId,
      values: [loginData.integrations.entraEam.identityId],
    },
  ]

  logger.info('OIDC EAM hook:whenEamAddPresentationConstraints augmenting constraints', {
    augmentedConstraints: augmentedConstraints.reduce(
      (acc, constraint) => {
        acc[constraint.claimName] = redactValueInner(constraint.values?.[0])
        return acc
      },
      {} as Record<string, string | undefined>,
    ),
  })

  return augmentedConstraints
}

export function whenEamGetAccountId(loginData: LoginInteractionData, credential: PresentedCredential) {
  // Ignore non-EAM requests
  if (!loginData.integrations?.entraEam) {
    logger.verbose('OIDC EAM hook:whenEamGetAccountId skipping non-EAM request')
    return undefined
  }

  invariant(
    compareIgnoreCase(credential.claims[StandardClaims.identityId], loginData.integrations.entraEam.identityId),
    'Identity ID mismatch during EAM OIDC account ID check',
  )

  logger.info('OIDC EAM hook:whenEamGetAccountId account Id', {
    issuanceId: credential.claims[StandardClaims.issuanceId],
    identityId: loginData.integrations.entraEam.identityId,
    accountId: redactValueInner(loginData.integrations.entraEam.sub),
  })
  return loginData.integrations.entraEam.sub
}

export function isEamRequestAndLoginShouldFail(loginData?: LoginInteractionData) {
  // Ignore non-EAM requests
  if (!loginData?.integrations?.entraEam) {
    logger.verbose('OIDC EAM hook:isEamRequestAndLoginShouldFail skipping non-EAM request')
    return false
  }

  // Fail the login if the identity ID is not set
  if (loginData.integrations.entraEam.identityId === undefined) {
    logger.warn('OIDC EAM hook:isEamRequestAndLoginShouldFail identity ID not set', { result: 'fail' })
    return true
  }
  logger.info('OIDC EAM hook:isEamRequestAndLoginShouldFail identity ID is set', { result: 'pass' })
  return false
}

export const eamLoginFailResult = {
  error: oauthErrors.accessDenied,
  error_description: 'No identity could be matched to the Entra user.',
}

export function whenEamApplyAmr(loginData: LoginInteractionData, amr: string[]) {
  // Ignore non-EAM requests
  if (!loginData.integrations?.entraEam) {
    logger.verbose('OIDC EAM hook:whenEamApplyAmr skipping non-EAM request')
    return amr
  }

  logger.verbose('OIDC EAM hook:whenEamApplyAmr amr', { amr: eamPresentationLoginStandardClaims.amr })
  return [...eamPresentationLoginStandardClaims.amr]
}

export function whenEamApplyAcr(loginData: LoginInteractionData, acr: string) {
  // Ignore non-EAM requests
  if (!loginData.integrations?.entraEam) {
    logger.verbose('OIDC EAM hook:whenEamApplyAcr skipping non-EAM request')
    return acr
  }

  logger.verbose('OIDC EAM hook:whenEamApplyAcr acr', { acr: eamPresentationLoginStandardClaims.acr })
  return eamPresentationLoginStandardClaims.acr as string
}

export const isEamRequest = (params: UnknownObject, clientId: string) => {
  // Confirm the basic OIDC parameters line up with expected EAM values
  if (
    !((params.scope as string | undefined) ?? '').includes('openid') ||
    params.response_type !== 'id_token' ||
    params.response_mode !== 'form_post' ||
    !params.id_token_hint ||
    !params.nonce ||
    !params.state
  ) {
    logger.info('OIDC EAM hook:isEamRequest skipping non-EAM request due to shape of parameters not matching', {
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
    logger.warn('OIDC EAM hook:isEamRequest skipping non-EAM request due to aud matching client ID', {
      params: extractLoggable(params, { header: {}, payload: decodedIdTokenHint }),
    })
    return false
  }

  // It is extremely unlikely that this is not an EAM request at this point. And if it isn't, it's an invalid request so breaking it by assuming it is EAM is fine
  logger.info('OIDC EAM hook:isEamRequest processing EAM request', {
    params: extractLoggable(params, { header: {}, payload: decodedIdTokenHint }),
  })
  if (isNelnetOrDevInstance) {
    logger.info('OIDC EAM hook:isEamRequest processing EAM request for Nelnet or Dev instance', {
      params_debug: {
        id_token_hint: params.id_token_hint,
        state: params.state,
      },
    })
  }
  return true
}

export const hookAndApplyCustomEntraEamSpec = (provider: Provider) => {
  // Override the authorization -> checkIdTokenHint pipeline step to apply custom logic for EAM requests
  wrapOidcPipelineStep(provider, 'authorization', ['POST'], 'checkIdTokenHint', async (ctx, next, original) => {
    const { oidc } = ctx as RouterContext & { oidc: OIDCContext }
    const { errors } = await oidcProviderModule()

    if (!oidc.client?.clientId) {
      logger.error(`Client ID not found in the OIDC context`, { params: extractLoggable(oidc.params!) })
      throw new errors.InvalidClient('Client not found')
    }

    // Don't intercept non-EAM requests
    if (!isEamRequest(oidc.params!, oidc.client.clientId)) {
      logger.verbose('OIDC EAM hook:authorization/post/checkIdTokenHint skipping non-EAM request')
      return original(ctx, next)
    }

    const authParams = paramsToAuthParamsSpec(oidc.params!, errors)

    const decodedProtectedHeader = decodeProtectedHeader(authParams.id_token_hint!)
    if (!decodedProtectedHeader.alg) {
      logger.error(`id_token_hint does not contain an alg header`, { params: extractLoggable(oidc.params!) })
      throw new errors.InvalidRequest('id_token_hint does not contain an alg header')
    }

    const payload = await verifyMultiIssuer(ctx.host, authParams.id_token_hint!, {
      issuerOptions: eamIssuerOptions,
      explicitNoAudienceValidation: true,
    })

    oidc.entity('IdTokenHint', { payload, header: decodeProtectedHeader })

    // Although the VO OIDC provider is session-less, we'll force the prompt here.
    // This ensures the implementation is accurate to a standard EAM flow,
    const { prompts } = oidc // Do not inline, as this is a getter and a new instance is created each time
    if (!prompts.has('login')) {
      prompts.add('login')
      oidc.params!.prompt = [...prompts].join(' ')
    }

    logger.verbose(`OIDC EAM hook:authorization/post/checkIdTokenHint intercept end`, {
      params: extractLoggable(oidc.params!, oidc.entities.IdTokenHint),
    })

    return next()
  })

  // Override the authorization -> interactions pipeline step to save the EAM sub and state to the interaction data
  wrapOidcPipelineStep(provider, 'authorization', ['POST'], 'interactions', async (ctx, next, original) => {
    const { oidc } = ctx as RouterContext & { oidc: OIDCContext }
    const { errors } = await oidcProviderModule()

    if (!oidc.client?.clientId) {
      logger.error(`Client ID not found in the OIDC context`, { params: extractLoggable(oidc.params!, oidc.entities.IdTokenHint) })
      throw new errors.InvalidClient('Client not found')
    }

    // Don't intercept non-EAM requests
    if (!isEamRequest(oidc.params!, oidc.client.clientId)) {
      logger.verbose('OIDC EAM hook:authorization/post/interactions skipping non-EAM request')
      return original(ctx, next)
    }

    // This intercept is a special case, because the provider doesn't call next if the interaction is started
    await original(ctx, next)

    // Started interactions will redirect, so if we're not redirecting, we should not apply the custom logic
    if (ctx.response.status !== 303) {
      logger.warn(`Interactions pipeline step did not redirect`, { params: extractLoggable(oidc.params!, oidc.entities.IdTokenHint) })
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

    if (!identity) {
      logger.warn('No identity could be matched during a EAM auth flow', {
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

    if (logger.isVerboseEnabled()) {
      logger.verbose('OIDC EAM hook:authorization/post/interactions intercept end', {
        preInteractionData: redactValueObjectUnknown(interactionData ?? {}),
        postInteractionData: redactValueObjectUnknown((await getLoginInteractionData(oidc.entities.Interaction.uid)) ?? {}),
        identity: { id: identity?.id, name: redactValueInner(identity?.name) },
        params: extractLoggable(oidc.params!),
      })
    }
  })

  // Override the resume -> processResponseTypes pipeline step to log the return token when verbose logging is enabled
  // The actual step we're targeting is `respond`, but `respond` calls `processResponseTypes` internally which returns the token. If we were to intercept `respond`, we would not have access to the token
  // unless we dug through http response to locate it. This is much cleaner.
  wrapOidcPipelineStep(provider, 'resume', ['GET'], 'processResponseTypes', async (ctx, next, original) => {
    const { oidc } = ctx as RouterContext & { oidc: OIDCContext }
    const { errors } = await oidcProviderModule()

    if (!oidc.client?.clientId) {
      logger.error(`Client ID not found in the OIDC context`, { params: extractLoggable(oidc.params!, oidc.entities.IdTokenHint) })
      throw new errors.InvalidClient('Client not found')
    }

    // Don't intercept non-EAM requests
    if (!isEamRequest(oidc.params!, oidc.client.clientId)) {
      logger.verbose('OIDC EAM hook:resume/get/processResponseTypes skipping non-EAM request')
      return original(ctx, next)
    }

    const response = (await original(ctx, next)) as { id_token: string; state: string | undefined } | undefined
    invariant(response?.id_token, 'id_token not found in response during EAM auth flow')
    const idTokenDecoded = decodeJwt(response.id_token)

    const logMetadata: Record<string, any> = {
      response: { id_token: redactValueObjectUnknown(idTokenDecoded) },
      params: extractLoggable(oidc.params!),
    }
    if (isNelnetOrDevInstance) logMetadata.response_debug = pick(response, ['id_token', 'state'])
    logger.info('OIDC EAM hook:resume/get/processResponseTypes intercept end', logMetadata)

    return response
  })
}
