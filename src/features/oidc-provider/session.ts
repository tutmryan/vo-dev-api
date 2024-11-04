import { getClientCredentialsToken, type AccessTokenResponse } from '@makerx/node-common'
import { pick } from 'lodash'
import { v5 as uuidv5 } from 'uuid'
import { oidcStorageService } from '.'
import { limitedOidcAuthnAuth, limitedOidcClient } from '../../config'
import { dataSource } from '../../data'
import type { Identity } from '../../generated/graphql'
import { newCacheSection, ONE_HOUR_TTL } from '../../redis/cache'
import { invariant } from '../../util/invariant'
import { Lazy } from '../../util/lazy'
import { createKey } from '../../util/token'
import { getPresentationDataFromCache } from '../presentation/callback/cache'
import { PresentationEntity } from '../presentation/entities/presentation-entity'
import { findClient } from './clients'
import type { ExtraParams } from './extra-params'

const loginInteractionCache = Lazy(() => newCacheSection('oidcAuthInteraction', ONE_HOUR_TTL))
const sessionInteractionCache = Lazy(() => newCacheSection('oidcAuthSession', ONE_HOUR_TTL))

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
 *  - The value of the client's `unique_claim_for_subject_identifier` configuration, which is required if issuanceId is not present
 * See https://github.com/bcgov/vc-authn-oidc/blob/main/docs/README.md#subject-identifer-mapping
 */
async function getSubjectIdentifier(claims: Record<string, unknown>, clientId: string, uniqueClaimForSubParam?: string): Promise<string> {
  // the subject identifier should not be the same for the same presentation across different clients
  // use the client id as the namespace for the uuid
  const uuidNamespace = clientId

  // when available, use the issuanceId claim as the unique identifier
  const issuanceId = claims.issuanceId as string | undefined
  if (issuanceId) return uuidv5(issuanceId, uuidNamespace)

  // otherwise, require supplied configuration for the unique claim, either:
  // - unique_claim_for_sub extra-param auth arg or;
  // - unique_claim_for_subject_identifier client configuration attribute
  const uniqueClaimForSubjectIdentifier = uniqueClaimForSubParam ?? (await findClient(clientId))?.unique_claim_for_subject_identifier
  invariant(
    uniqueClaimForSubjectIdentifier,
    'Either unique_claim_for_sub auth param or unique_claim_for_subject_identifier client setting is required for presentations without an issuanceId claim',
  )
  const uniqueClaimValue = claims[uniqueClaimForSubjectIdentifier] as string | undefined
  invariant(uniqueClaimValue, `The claim: '${uniqueClaimForSubjectIdentifier}' is not in this presentation`)
  return uuidv5(uniqueClaimValue, uuidNamespace)
}

export async function completeLogin({
  interactionId,
  requestId,
  clientId,
  vc_unique_claim_for_sub,
}: {
  interactionId: string
  requestId: string
  clientId: string
  [ExtraParams.vc_unique_claim_for_sub]?: string
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
  const { claims: allClaims, type: types, issuer } = credential
  const { issuanceId, photo, ...claims } = allClaims
  const accountId = await getSubjectIdentifier(allClaims, clientId, vc_unique_claim_for_sub)

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
