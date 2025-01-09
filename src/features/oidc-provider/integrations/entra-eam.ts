import type { RouterContext } from '@koa/router'
import type { JWK, JWTPayload, JWTVerifyGetKey, KeyLike } from 'jose'
import { createLocalJWKSet, createRemoteJWKSet, decodeJwt, decodeProtectedHeader, jwtVerify } from 'jose'
import type { interactionPolicy, Configuration, Errors, OIDCContext, UnknownObject } from 'oidc-provider'
import { eamFriendlyTenants } from '../../../config'
import { dataSource } from '../../../data'
import type { ClaimConstraint } from '../../../generated/graphql'
import { logger } from '../../../logger'
import { newCacheSection, ONE_HOUR_TTL } from '../../../redis/cache'
import { invariant } from '../../../util/invariant'
import { Lazy } from '../../../util/lazy'
import { throwError } from '../../../util/throw-error'
import { IdentityEntity } from '../../identity/entities/identity-entity'
import { paramsToAuthParamsSpec, wrapOidcPipelineStep } from '../integration-hook'
import { getData, getProvider, oidcProviderModule } from '../provider'
import { getLoginInteractionData, setLoginInteractionData } from '../session'

enum ExtraParams {
  client_request_id = 'client-request-id',
}

export const eamExtraParams: Configuration['extraParams'] = {
  async [ExtraParams.client_request_id](ctx, value, _client) {
    if (ctx.oidc.params) ctx.oidc.params[ExtraParams.client_request_id] = value
  },
}

type OidcMetadata = {
  uri: string
  openidConfiguration: {
    jwks_uri: string
  }
}

// Depending on the flavour of Azure, the OIDC metadata URI can be different.
const entraOidcMetadataUris = [
  'https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration', // MS Azure
  'https://login.microsoftonline.us/common/v2.0/.well-known/openid-configuration', // MS Azure - Government
  'https://login.partner.microsoftonline.cn/common/v2.0/.well-known/openid-configuration', // MS Azure - China
]

const isMsLoginUri = (uri: string) =>
  uri.startsWith('https://login.microsoftonline.com') ||
  uri.startsWith('https://login.microsoftonline.us') ||
  uri.startsWith('https://login.partner.microsoftonline.cn')

const extractLoggable = (params: UnknownObject) => {
  return {
    clientRequestId: params[ExtraParams.client_request_id],
    idTokenHint: params.id_token_hint,
    redirectUri: params.redirect_uri,
    responseMode: params.response_mode,
    responseType: params.response_type,
    scope: params.scope,
  }
}

export const eamPresentationLoginStandardClaims = {
  // Note: EAM only allows a single amr value
  amr: ['pop'],
  // Note: sending only 'possession' as the acr value does not work
  acr: 'possessionorinherence',
} as const

export async function buildEamIdentityConstraint(params: UnknownObject, errors: Errors): Promise<ClaimConstraint> {
  invariant(params.id_token_hint && typeof params.id_token_hint === 'string', 'id_token_hint is required for EAM clients')

  const decodedIdTokenHint = decodeJwt(params.id_token_hint)
  const objectId = (decodedIdTokenHint.oid as string | undefined) ?? ''
  const tenantId = (decodedIdTokenHint.tid as string | undefined) ?? ''

  invariant(objectId && tenantId, 'Both oid and tid are required to be present in the id_token_hint during an EAM flow')

  const identity = await dataSource.getRepository(IdentityEntity).findOne({
    where: {
      identifier: objectId,
      issuer: tenantId,
    },
  })

  if (!identity) {
    logger.error(`Identity not found matching object ${objectId} and tenant ${tenantId}`, { params: extractLoggable(params) })
    throw new errors.AccessDenied('Identity not found')
  }

  return {
    claimName: 'identityId',
    values: [identity.id],
  }
}

// A TTL of 12 hours was chosen because:
// - Dotnet defaults to 12 hours
// - The MS docs state that Entra caches this metadata for 24 hours (Ref: https://learn.microsoft.com/en-us/entra/identity/authentication/concept-authentication-external-method-provider#provider-metadata-caching)
const eamOidcMetadataCache = Lazy(() => newCacheSection('oidcEam', ONE_HOUR_TTL * 12))

// Cache the Entra keys in memory
const inMemoryKeySetCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>()

const fetchEntraOidcMetadata = async () => {
  let cachedRawMetadata = await eamOidcMetadataCache().get('metadata')

  if (!cachedRawMetadata) {
    // Clear the key cache to force a reload of the JWK set in case the jwks_uri has changed
    inMemoryKeySetCache.clear()
    const remoteMetadata = await Promise.all(
      entraOidcMetadataUris.map(async (uri) => {
        const openidConfiguration = await fetch(uri).then((res) => res.json())
        return { uri, openidConfiguration }
      }),
    )
    cachedRawMetadata = JSON.stringify(remoteMetadata)
    await eamOidcMetadataCache().set('metadata', cachedRawMetadata)
  }

  const allMetadata = JSON.parse(cachedRawMetadata) as OidcMetadata[]

  // Ensure that we're tracking and caching the JWK set for each metadata URI
  for (const metaData of allMetadata) {
    if (!inMemoryKeySetCache.has(metaData.uri)) {
      inMemoryKeySetCache.set(metaData.uri, createRemoteJWKSet(new URL(metaData.openidConfiguration.jwks_uri)))
    }
  }

  return allMetadata.map((metaData) => ({
    ...metaData,
    jwkSet: inMemoryKeySetCache.get(metaData.uri)!,
  }))
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
  if (!params['client-request-id']) return false

  const decodedIdTokenHint = decodeJwt(params.id_token_hint as string)

  // Confirm the EAM specific parameters (Object ID, Tenant ID, and Issuer)
  if (!decodedIdTokenHint.oid || !decodedIdTokenHint.tid || !isMsLoginUri(decodedIdTokenHint.iss ?? '')) return false

  // As this token wasn't issued by the client (us), the aud should not match the client ID
  // MS Docs say the value they send is the client ID registered in EAM, which is actually the spec (if we had issued it). However, the App ID registered for EAM is supplied in practice.
  if (decodedIdTokenHint.aud === clientId) return false

  // It is extremely unlikely that this is not an EAM request at this point. And if it isn't, it's an invalid request so breaking it by assuming it is EAM is fine
  return true
}

export const hookAndApplyCustomEntraEamSpec = () => {
  // Override the authorization -> checkIdTokenHint pipeline step to apply custom logic for EAM requests
  wrapOidcPipelineStep('authorization', ['POST'], 'checkIdTokenHint', async (ctx, next, original) => {
    const { oidc } = ctx as RouterContext & { oidc: OIDCContext }
    const { clients } = getData()
    const { errors } = await oidcProviderModule()

    if (!oidc.client?.clientId) {
      logger.error(`Client ID not found in the OIDC context`, { params: extractLoggable(oidc.params!) })
      throw new errors.InvalidClient('Client not found')
    }

    const clientId = oidc.client!.clientId.toLowerCase()
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

    const eamOidcConfigs = await fetchEntraOidcMetadata()

    let keys: JWK[] = []
    for (const eamOidcConfig of eamOidcConfigs) {
      if (!eamOidcConfig.jwkSet.fresh) await eamOidcConfig.jwkSet.reload()
      keys = [...keys, ...(eamOidcConfig.jwkSet.jwks()?.keys ?? [])]
    }
    // Deduplicate keys on the kty and kid fields
    // This is done because we're treating all the Entra OIDC metadata URIs as a single source of truth
    keys = keys.filter((key, index) => keys.findIndex((k) => k.kty === key.kty && k.kid === key.kid) === index)

    const { payload, protectedHeader } = await jwtVerify<JWTPayload, KeyLike>(
      authParams.id_token_hint!,
      createLocalJWKSet({ keys }) as JWTVerifyGetKey,
      {
        issuer: `https://login.microsoftonline.com/${tenantId}/v2.0`,
      },
    )

    oidc.entity('IdTokenHint', { payload, header: protectedHeader })

    return next()
  })

  const provider = getProvider()

  // Save the EAM sub and state to the interaction data
  provider.on('interaction.started', async (ctx) => {
    const { oidc } = ctx

    invariant(oidc.params, 'Params not found post interaction.started event')
    invariant(oidc.client, 'Client not found post interaction.started event')

    // Is this an EAM request?
    if (!isEamRequest(oidc.params, oidc.client.clientId)) {
      return
    }

    invariant(oidc.entities.Interaction, 'Interaction entity not found post interaction.started event during EAM auth flow')
    invariant(oidc.entities.IdTokenHint, 'IdTokenHint entity not found post interaction.started event during EAM auth flow')

    const interactionData = await getLoginInteractionData(oidc.entities.Interaction.uid)
    if (interactionData) invariant(interactionData.state !== 'pre-start', 'Interaction data was in an incorrect state for EAM auth flow')

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
        },
      },
    })
  })
}

// Note: another way to force login could be to use the method from 'check_max_age.js' from the source library,
// which evaluates to if (!ctx.oidc.prompts.had('login')) ctx.oidc.prompts.add('login')
export const addEntraEamAlwaysPromptPolicyStep = async (
  policy: interactionPolicy.DefaultPolicy,
): Promise<interactionPolicy.DefaultPolicy> => {
  const loginPolicy = policy.get('login')
  invariant(loginPolicy, 'login policy not found in the interaction policy')

  const { interactionPolicy } = await oidcProviderModule()

  // The interaction step confirms prompt behaviour by running all checks and looking for one or more REQUEST_PROMPT (true) results
  // Ref: https://github.com/panva/node-oidc-provider/blob/cca48753c3a8079a59fa7837fdcfaa4ea2d9b946/lib/actions/authorization/interactions.js#L28
  loginPolicy.checks.add(
    new interactionPolicy.Check('eam-force-prompt', 'EAM force prompt', async (ctx) => {
      const { oidc } = ctx

      if (oidc.route === 'authorization' && isEamRequest(oidc.params!, oidc.client!.clientId)) {
        return interactionPolicy.Check.REQUEST_PROMPT
      }

      return interactionPolicy.Check.NO_NEED_TO_PROMPT
    }),
  )

  return policy
}
