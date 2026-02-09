import { randomUUID } from 'crypto'
import { addMilliseconds } from 'date-fns'
import type { CommandContext } from '../../../cqs'
import { isMDocPresentationsEnabled, registerFeatureCheck } from '../../../cqs/feature-map'
import type { MDocPresentationRequestInput, MDocPresentationResponse } from '../../../generated/graphql'
import { invariant } from '../../../util/invariant'
import { userInvariant } from '../../../util/user-invariant'
import { createOrUpdateIdentity } from '../../identity'
import { IdentityEntity } from '../../identity/entities/identity-entity'
import { buildISO18013_7DeviceRequest } from '../mdoc/protocols/orgIsoMdoc'
import { MDOC_TTL, mdocRequestDetailsCache } from '../mdoc/shared-config'
import type { MDocRequestClaimPath, MDocRequestDetails } from '../mdoc/types'

registerFeatureCheck(CreateMDocPresentationRequestCommand, async (...[,]) => isMDocPresentationsEnabled())

export async function CreateMDocPresentationRequestCommand(
  this: CommandContext,
  { identityId, identity: identityInput, ...request }: MDocPresentationRequestInput,
): Promise<MDocPresentationResponse> {
  const { user, entityManager } = this

  userInvariant(user)
  invariant(request.requestedClaims.length > 0, 'At least one claim must be requested')
  invariant(request.docType, 'Document type must be specified')

  invariant(
    [identityId ? 1 : 0, identityInput ? 1 : 0, request.requestedClaims.some((c) => c.useForIdentity) ? 1 : 0].reduce((a, b) => a + b, 0) <=
      1,
    'Only a single method of identity specification is allowed (identityId, identity input, or useForIdentity claim(s))',
  )

  // Find or create the identity, if provided
  const identity = identityId
    ? await entityManager.getRepository(IdentityEntity).findOneByOrFail({ id: identityId })
    : identityInput
      ? await createOrUpdateIdentity(entityManager, identityInput)
      : undefined

  const requestId = randomUUID()

  const requestedClaims = request.requestedClaims.map((c) => {
    const mapped: MDocRequestClaimPath = { path: c.path }
    if (typeof c.intentToRetain === 'boolean') mapped.intentToRetain = c.intentToRetain
    if (typeof c.useForIdentity === 'boolean') mapped.useForIdentity = c.useForIdentity
    return mapped
  })

  // Build ISO18013-7 DeviceRequest (CBOR-encoded) with ephemeral encryption key
  const origin = request.signing?.expectedOrigins[0] ?? ''
  const orgIsoMdoc = await buildISO18013_7DeviceRequest(requestId, request.docType, requestedClaims, origin)

  // Store request details in cache for later validation
  const requestDetails: MDocRequestDetails = {
    requestId,
    requestedById: user.entity.id,
    identityId: identity?.id,
    docType: request.docType,
    requestedClaims: requestedClaims,
    createdAt: Date.now(),
    // TODO  (mdoc): Implement callback handling
    callback: request.callback ?? undefined,
  }

  const cache = mdocRequestDetailsCache()
  await cache.set(requestId, requestDetails, MDOC_TTL)

  return {
    requestId,
    request: {
      deviceRequest: orgIsoMdoc.deviceRequest,
      encryptionInfo: orgIsoMdoc.encryptionInfo,
    },
    expiry: addMilliseconds(new Date(), MDOC_TTL).getTime() / 1000,
  }
}
