import { getClientCredentialsToken, type AccessTokenResponse } from '@makerx/node-common'
import { compact, pick } from 'lodash'
import type { UnknownObject } from 'oidc-provider'
import { v5 as uuidv5 } from 'uuid'
import { oidcProviderModule, oidcStorageService } from '.'
import { limitedOidcAuthnAuth, limitedOidcClient } from '../../config'
import { dataSource } from '../../data'
import type { ClaimConstraint, Identity, PresentationRequestForAuthnInput, RequestConfiguration } from '../../generated/graphql'
import { newCacheSection, ONE_HOUR_TTL } from '../../redis/cache'
import { getPlatformIssuerDid } from '../../services'
import { invariant } from '../../util/invariant'
import { Lazy } from '../../util/lazy'
import { createKey } from '../../util/token'
import type { PartnerEntity } from '../partners/entities/partner-entity'
import { getPresentationDataFromCache } from '../presentation/callback/cache'
import { PresentationEntity } from '../presentation/entities/presentation-entity'
import type { OidcClientEntity } from './entities/oidc-client-entity'
import { ExtraParams } from './extra-params'

const loginInteractionCache = Lazy(() => newCacheSection('oidcAuthInteraction', ONE_HOUR_TTL))
const sessionInteractionCache = Lazy(() => newCacheSection('oidcAuthSession', ONE_HOUR_TTL))

const claimConstraintOperators = ['values', 'contains', 'startsWith'] as const

type LoginInteractionData = {
  state: 'started' | 'in-progress' | 'complete'
  interactionId: string
  clientId: string
  sessionKey: string
  requestId?: string
  presentationId?: string
}

export async function acquireLoginPresentationToken({
  interactionId,
  clientId,
}: {
  interactionId: string
  clientId: string
}): Promise<AccessTokenResponse> {
  const interactionData = await getLoginInteractionData(interactionId)
  invariant(interactionData === undefined, 'Interaction session already exists')
  const token = await getClientCredentialsToken(limitedOidcAuthnAuth)
  const sessionKey = getSessionKey(token.access_token)
  await sessionInteractionCache().set(sessionKey, interactionId)
  await setLoginInteractionData({ interactionId, state: 'started', clientId, sessionKey })
  return token
}

export async function buildAuthnPresentationRequest(
  params: UnknownObject,
  client: OidcClientEntity,
  partners: PartnerEntity[],
): Promise<PresentationRequestForAuthnInput> {
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
  const constraintValue = params[ExtraParams.vc_constraint_value] as string | undefined
  const constraintValues = constraintValue && constraintOperator === 'values' ? constraintValue.split(',') : undefined

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

  return {
    requestedCredentials: [
      {
        type,
        acceptedIssuers: vcIssuerParam ? [vcIssuerParam] : undefined,
        configuration: buildRequestConfiguration(params, client),
        constraints,
      },
    ],
  }
}

const faceCheckMinConfidenceThreshold = 50
const faceCheckMaxConfidenceThreshold = 70
const faceCheckOn: RequestConfiguration = { validation: { faceCheck: {} } }

function buildRequestConfiguration(params: UnknownObject, client: OidcClientEntity): RequestConfiguration | undefined {
  const faceCheckParam = params[ExtraParams.vc_facecheck] as string | undefined
  const faceCheckClientDefault = client.requireFaceCheck ? faceCheckOn : undefined
  if (faceCheckParam === 'true') return faceCheckOn
  const asNumber = Number(faceCheckParam)
  if (!Number.isNaN(asNumber) && asNumber >= faceCheckMinConfidenceThreshold && asNumber <= faceCheckMaxConfidenceThreshold)
    return { validation: { faceCheck: { matchConfidenceThreshold: asNumber } } }
  return faceCheckClientDefault
}

export type PresentationLoginAccount = {
  accountId: string
  presentationId: string
  issuanceId?: string
  identity?: Pick<Identity, 'id' | 'identifier' | 'issuer' | 'name'>
  name?: string
  did: string
  credentialType: string
  credentialClaims?: Record<string, unknown>
  revocationStatus?: string
  faceCheckMatchConfidenceScore?: number
}

/**
 * Returns a subject identifier (namespaced to the client ID) for the presentation based on either:
 *  - The issuanceId claim, if present
 *  - The value of the claim with key specified via auth request param `vc_unique_claim_for_sub`, required if issuanceId is not present, or the single value from the client uniqueClaimsForSub config
 * See https://github.com/bcgov/vc-authn-oidc/blob/main/docs/README.md#subject-identifer-mapping
 */
async function getSubjectIdentifier(
  claims: Record<string, unknown>,
  clientId: string,
  uniqueClaimForSubParam?: string,
  clientUniqueClaimsForSub?: string[],
): Promise<string> {
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
  const uniqueClaimForSub = uniqueClaimForSubParam ?? clientUniqueClaimsForSub?.find((claim) => !!claims[claim])
  invariant(
    uniqueClaimForSub,
    'A valid unique claim for the subject identifier could not be determined from the client configuration nor the `vc_unique_claim_for_sub` auth request parameter',
  )
  const uniqueClaimValue = claims[uniqueClaimForSub] as string | undefined
  invariant(uniqueClaimValue, `Unique claim '${uniqueClaimForSub}' is not available in the presentation claims`)
  return uuidv5(uniqueClaimValue, uuidNamespace)
}

export async function completeLogin(
  {
    interactionId,
    requestId,
    clientId,
    uniqueClaimForSubParam,
  }: {
    interactionId: string
    requestId: string
    clientId: string
    uniqueClaimForSubParam?: string
  },
  clientUniqueClaimsForSubjectId: string[],
): Promise<PresentationLoginAccount> {
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
  const { claims: allClaims, type: types, issuer } = credential
  const { issuanceId, photo, ...claims } = allClaims
  const accountId = await getSubjectIdentifier(allClaims, clientId, uniqueClaimForSubParam, clientUniqueClaimsForSubjectId)

  const account: PresentationLoginAccount = {
    accountId,
    presentationId,
    issuanceId: issuanceId as string | undefined,
    identity: identity ? pick(identity, ['id', 'issuer', 'identifier', 'name']) : undefined,
    name: identity?.name,
    did: issuer,
    credentialType: types[1] ?? 'unknown',
    credentialClaims: claims,
    revocationStatus: credential.credentialState.revocationStatus as string | undefined,
    faceCheckMatchConfidenceScore: credential.faceCheck?.matchConfidenceScore,
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
