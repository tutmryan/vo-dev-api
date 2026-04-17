import { getClientCredentialsToken, type AccessTokenResponse } from '@makerx/node-common'
import { compact, pick } from 'lodash'
import type { ClaimsParameter, UnknownObject } from 'oidc-provider'
import { v5 as uuidv5 } from 'uuid'
import { oidcProviderModule, oidcStorageService } from '.'
import { faceCheckEnabled, limitedOidcAuthnAuth, limitedOidcClient } from '../../config'
import { dataSource } from '../../data'
import type { ClaimConstraint, Identity, RequestConfiguration, RequestCredential } from '../../generated/graphql'
import type { Logger } from '../../logger'
import { newCacheSection } from '../../redis/cache'
import { getPlatformIssuerDid } from '../../services'
import { invariant } from '../../util/invariant'
import { Lazy } from '../../util/lazy'
import { redactValueObjectUnknown } from '../../util/redact-values'
import { createKey } from '../../util/token'
import type { PartnerEntity } from '../partners/entities/partner-entity'
import { getPresentationDataFromCache } from '../presentation/callback/cache'
import { PresentationEntity } from '../presentation/entities/presentation-entity'
import { mapClaims } from './claims'
import { simplifyClaimParameter } from './claims-parameter'
import { resolveDynamicConstraintValue, valueIsDynamic } from './dynamic-constraint-values'
import type { OidcClaimMappingEntity } from './entities/oidc-claim-mapping-entity'
import type { OidcClientEntity } from './entities/oidc-client-entity'
import { ExtraParams } from './extra-params'
import { addEamPresentationConstraints, getEamAccountId } from './integrations/entra-eam'
import { OIDC_TTL } from './ttl'

const loginInteractionCache = Lazy(() => newCacheSection('oidcAuthInteraction', OIDC_TTL.Interaction * 1000))
const sessionInteractionCache = Lazy(() => newCacheSection('oidcAuthSession', OIDC_TTL.Interaction * 1000))

const claimConstraintOperators = ['values', 'contains', 'startsWith'] as const

type LoginInteractionDataPostStart = {
  state: 'started' | 'in-progress' | 'complete'
  interactionId: string
  clientId: string
  sessionKey: string
  requestId?: string
  presentationId?: string
  requestedClaims?: ClaimsParameter
  integrations?: {
    entraEam?: {
      sub: string
      identityId?: string
    }
  }
  requestedCredential?: RequestCredential
}

type LoginInteractionDataPreStart = {
  state: 'pre-start'
  interactionId: string
} & Partial<Omit<LoginInteractionDataPostStart, 'interactionId' | 'state'>>

export type LoginInteractionData = LoginInteractionDataPostStart | LoginInteractionDataPreStart

export async function acquireLoginPresentationToken(): Promise<AccessTokenResponse> {
  return await getClientCredentialsToken(limitedOidcAuthnAuth)
}

export async function extractRequestedCredentials(
  params: UnknownObject,
  client: OidcClientEntity,
  partners: PartnerEntity[],
  loginInteractionData: LoginInteractionData | undefined,
  logger: Logger,
): Promise<RequestCredential> {
  const vcTypeParam = params[ExtraParams.vc_type] as string | undefined
  const vcIssuerParam = params[ExtraParams.vc_issuer] as string | undefined

  const { errors } = await oidcProviderModule()

  // validate type against client configuration
  if (vcTypeParam && client.credentialTypes && client.credentialTypes.length > 0) {
    if (!client.credentialTypes.includes(vcTypeParam))
      throw new errors.InvalidTarget(`Client does not support requested credential type: ${vcTypeParam}`)
  }

  // validate partner issuer against client + instance partner configuration
  const isPartnerIssuer = vcIssuerParam && vcIssuerParam !== (await getPlatformIssuerDid())
  if (isPartnerIssuer) {
    const partnerDids = partners.map((p) => p.did)
    const clientPartnerDids =
      client.partnerIds.length > 0
        ? compact(client.partnerIds.map((partnerId) => partners.find((p) => p.id === partnerId)?.did))
        : undefined

    if (clientPartnerDids) {
      if (!clientPartnerDids.includes(vcIssuerParam))
        throw new errors.InvalidTarget(`Client does not support requested issuer: ${vcIssuerParam}`)
    } else if (client.allowAnyPartner) {
      if (!partnerDids.includes(vcIssuerParam))
        throw new errors.InvalidTarget(`The requested issuer: ${vcIssuerParam} is not a valid partner`)
    } else throw new errors.InvalidTarget(`Client does not support requested issuer: ${vcIssuerParam}`)
  }

  // determine the type of credential to request, either the specified param, single type from client, or 'any'
  const clientSingleCredentialType = client.credentialTypes?.length === 1 ? client.credentialTypes[0] : undefined
  const type = vcTypeParam ?? clientSingleCredentialType ?? 'VerifiableCredential'

  // for partner presentations, the type must be valid for the partner configuration
  if (isPartnerIssuer) {
    const partner = partners.find((p) => p.did === vcIssuerParam)
    if (!partner?.credentialTypes.includes(type))
      throw new errors.InvalidTarget(`The requested credential type '${type}' is not configured for partner issuer: ${vcIssuerParam}`)
  }

  // validate constraint params
  const constraintName = params[ExtraParams.vc_constraint_name] as string | undefined
  const constraintOperator = params[ExtraParams.vc_constraint_operator] as (typeof claimConstraintOperators)[number] | undefined
  let constraintValue = params[ExtraParams.vc_constraint_value] as string | undefined
  let constraintValues = constraintValue && constraintOperator === 'values' ? constraintValue.split(',') : undefined

  // Resolve dynamic constraint values to their actual values to ensure proper validation and processing
  if (valueIsDynamic(constraintValue)) {
    constraintValue = resolveDynamicConstraintValue(constraintValue, params)
  }
  constraintValues = constraintValues?.map((value) => (valueIsDynamic(value) ? resolveDynamicConstraintValue(value, params) : value))

  // assign constraints, if provided
  let constraints: ClaimConstraint[] | undefined

  if (constraintName) {
    if (!constraintOperator)
      throw new errors.InvalidTarget(`Claim constraint operator is required via ${ExtraParams.vc_constraint_operator} param`)
    if (!claimConstraintOperators.includes(constraintOperator))
      throw new errors.InvalidTarget(`Invalid claim constraint operator: ${constraintOperator}`)
    if (!constraintValue) throw new errors.InvalidTarget(`Claim constraint value is required via ${ExtraParams.vc_constraint_value} param`)

    constraints = [
      {
        claimName: constraintName,
        [constraintOperator]: constraintOperator === 'values' ? constraintValues : constraintValue,
      },
    ]
  }

  // EAM Integration hooks
  if (loginInteractionData?.integrations?.entraEam) {
    constraints = addEamPresentationConstraints(loginInteractionData, constraints, logger)
  }

  const requestedCredential = {
    type,
    acceptedIssuers: vcIssuerParam ? [vcIssuerParam] : undefined,
    configuration: buildRequestConfiguration(client, loginInteractionData),
    constraints,
  }

  logger.verbose('OIDC login requested credential', {
    requestedCredential: redactValueObjectUnknown(requestedCredential),
  })

  return requestedCredential
}

function buildRequestConfiguration(
  client: OidcClientEntity,
  loginInteractionData?: LoginInteractionData,
): RequestConfiguration | undefined {
  const threshold = client.faceCheckConfidenceThreshold ?? 70

  const shouldApplyFaceCheck =
    client.requireFaceCheck ||
    (!loginInteractionData?.integrations?.entraEam &&
      simplifyClaimParameter(loginInteractionData?.requestedClaims?.id_token?.amr ?? undefined)?.values.includes('face'))

  if (!shouldApplyFaceCheck) return undefined

  return {
    validation: {
      faceCheck: {
        matchConfidenceThreshold: threshold,
      },
    },
  }
}

export type PresentationLoginAccount = {
  accountId: string
  presentationId: string
  issuanceId?: string
  identity?: Pick<Identity, 'id' | 'identifier' | 'issuer' | 'name'>
  name?: string
  did: string
  credentialType: string[]
  credentialClaims?: Record<string, unknown>
  mappedCredentialClaims?: Record<string, string>
  revocationStatus?: string
  credentialSupportsFaceCheck?: boolean
  faceCheckMatchConfidenceScore?: number
  requestedClaims?: ClaimsParameter
}

/**
 * Returns a subject identifier (namespaced to the client ID) for the presentation based on either:
 *  - The issuanceId claim, if present
 *  - The value of the claim with key specified via auth request param `vc_unique_claim_for_sub`, required if issuanceId is not present, or the single value from the client uniqueClaimsForSub config
 * See https://github.com/bcgov/vc-authn-oidc/blob/main/docs/README.md#subject-identifer-mapping
 */
function getSubjectIdentifier(
  claims: Record<string, unknown>,
  clientId: string,
  uniqueClaimForSubParam?: string,
  clientUniqueClaimsForSub?: string[],
  clientIdentityResolverClaims?: string[],
): string {
  // the subject identifier should not be the same for the same presentation across different clients
  // use the client id as the namespace for the uuid
  const uuidNamespace = clientId

  // when available, use the issuanceId claim as the unique identifier
  const issuanceId = claims.issuanceId as string | undefined
  if (issuanceId) return uuidv5(issuanceId, uuidNamespace)

  // otherwise, determine the unique claim to use from the client configuration or the auth request param
  if (uniqueClaimForSubParam && clientUniqueClaimsForSub && clientUniqueClaimsForSub.length > 0)
    invariant(
      clientUniqueClaimsForSub.includes(uniqueClaimForSubParam),
      `The unique claim '${uniqueClaimForSubParam}' specified in the auth request is not allowed for the client`,
    )
  const uniqueClaimForSub =
    uniqueClaimForSubParam ??
    clientUniqueClaimsForSub?.find((claim) => !!claims[claim]) ??
    clientIdentityResolverClaims?.find((claim) => !!claims[claim])

  invariant(
    uniqueClaimForSub,
    'A valid unique claim for the subject identifier could not be determined from the client configuration nor the `vc_unique_claim_for_sub` auth request parameter',
  )
  const uniqueClaimValue = claims[uniqueClaimForSub] as string | undefined
  invariant(uniqueClaimValue, `Unique claim '${uniqueClaimForSub}' is not available in the presentation claims`)
  return uuidv5(uniqueClaimValue, uuidNamespace)
}

export async function completeLogin({
  interactionId,
  requestId,
  clientId,
  uniqueClaimForSubParam,
  clientUniqueClaimsForSubjectId,
  clientClaimMappings,
  clientIdentityResolverClaims,
  logger,
}: {
  interactionId: string
  requestId: string
  clientId: string
  uniqueClaimForSubParam?: string
  clientUniqueClaimsForSubjectId: string[]
  clientClaimMappings: OidcClaimMappingEntity[]
  clientIdentityResolverClaims: string[]
  logger: Logger
}): Promise<PresentationLoginAccount> {
  // Verify the login interaction state
  const interactionData = await getLoginInteractionData(interactionId)
  invariant(interactionData, 'Interaction session not found')
  invariant(interactionData.state === 'complete', 'Login presentation was not completed')
  invariant(interactionData.requestId === requestId, 'Invalid request id')

  // Delete the interaction / session data
  await loginInteractionCache().delete(interactionId)
  await sessionInteractionCache().delete(interactionData.sessionKey)

  // Get the presentation data
  const presentation = await dataSource
    .getRepository(PresentationEntity)
    .findOneOrFail({ where: { id: interactionData.presentationId }, relations: { identity: true } })
  const identity = await presentation.identity
  const presentationEvent = await getPresentationDataFromCache(requestId)
  invariant(presentationEvent?.presentationId, 'No presentation event found')
  const { event, presentationId } = presentationEvent
  const credential = event.verifiedCredentialsData?.[0]
  invariant(credential, 'No credential in presentation data')

  // Build the login result
  const { claims: allClaims, issuer } = credential
  const [_, ...type] = credential.type
  const { issuanceId, identityId, photo, ...credentialClaims } = allClaims

  // When EAM integration is present, use the EAM account ID
  // Only use identity resolver claims for subject identifier if identity was actually resolved
  const resolverClaimsForSubject = identity ? clientIdentityResolverClaims : []
  const accountId = interactionData.integrations?.entraEam
    ? getEamAccountId(interactionData, credential, logger)
    : getSubjectIdentifier(allClaims, clientId, uniqueClaimForSubParam, clientUniqueClaimsForSubjectId, resolverClaimsForSubject)

  const applicableClaimMappings = clientClaimMappings.filter(({ credentialTypes }) => {
    if (!credentialTypes || credentialTypes.length === 0) return true
    return credentialTypes.some((type) => type.includes(type))
  })
  if (logger.isVerboseEnabled() && applicableClaimMappings.length > 0)
    logger.verbose('OIDC applying claim mappings', {
      clientId,
      interactionId,
      requestId,
      mappings: applicableClaimMappings.map((mapping) => pick(mapping, 'id', 'name', 'mappings', 'credentialTypes')),
    })

  const account: PresentationLoginAccount = {
    accountId,
    presentationId,
    issuanceId: issuanceId as string | undefined,
    identity: identity ? pick(identity, ['id', 'issuer', 'identifier', 'name']) : undefined,
    name: identity?.name,
    did: issuer,
    credentialType: type,
    credentialClaims,
    mappedCredentialClaims: mapClaims(credentialClaims, applicableClaimMappings),
    revocationStatus: credential.credentialState.revocationStatus as string | undefined,
    faceCheckMatchConfidenceScore: credential.faceCheck?.matchConfidenceScore,
    credentialSupportsFaceCheck: faceCheckEnabled && !!photo,
    requestedClaims: interactionData.requestedClaims,
  }

  // Persist the account
  await oidcStorageService().uploadAccount(accountId, account)

  return account
}

export async function validateLoginSessionForPresentation(authnSessionKey: string, requestId: string): Promise<LoginInteractionData> {
  const interactionId = await getInteractionId(authnSessionKey)
  invariant(interactionId, 'Interaction session not found')
  const loginInteractionData = await getLoginInteractionData(interactionId)
  invariant(loginInteractionData, 'Login data for session not found')
  invariant(
    loginInteractionData.state === 'in-progress' && loginInteractionData.requestId === requestId,
    'Invalid login interaction state for presentation',
  )
  return loginInteractionData
}

export async function setLoginInteractionData(data: LoginInteractionData): Promise<void> {
  await loginInteractionCache().set(data.interactionId, JSON.stringify(data))
}

export async function setupLoginSession(interactionId: string, token: AccessTokenResponse): Promise<void> {
  const sessionKey = getSessionKey(token.access_token)
  await sessionInteractionCache().set(sessionKey, interactionId)
}

export async function getLoginInteractionData(interactionId: string): Promise<LoginInteractionData | undefined> {
  const interaction = await loginInteractionCache().get(interactionId)
  return interaction ? JSON.parse(interaction) : undefined
}

export async function getInteractionId(sessionKey: string): Promise<string | undefined> {
  return await sessionInteractionCache().get(sessionKey)
}

export async function getLoginInteractionDataForSession(token: string): Promise<LoginInteractionData | undefined> {
  const interactionId = await getInteractionId(getSessionKey(token))
  if (!interactionId) return undefined
  return getLoginInteractionData(interactionId)
}

export function getSessionKey(token: string): string {
  return createKey(token, limitedOidcClient.secret)
}

export type OidcSessionContext = {
  interactionId: string
  clientId?: string
}

export async function getOidcSessionContext(token?: string, logger?: Logger): Promise<OidcSessionContext | undefined> {
  if (!token) return undefined
  try {
    const loginInteractionData = await getLoginInteractionDataForSession(token)
    if (!loginInteractionData) return undefined

    return {
      interactionId: loginInteractionData.interactionId,
      clientId: loginInteractionData.state === 'pre-start' ? undefined : loginInteractionData.clientId,
    }
  } catch (error) {
    logger?.verbose('Failed to get OIDC session context', { error })
    return undefined
  }
}
