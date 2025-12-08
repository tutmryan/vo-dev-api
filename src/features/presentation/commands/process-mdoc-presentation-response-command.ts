import type { CommandContext } from '../../../cqs'
import { isMDocEnabled, registerFeatureCheck } from '../../../cqs/feature-map'
import type {
  MDocClaim,
  MDocDocument,
  MDocNamespace,
  MDocPresentationResponseInput,
  MDocProcessedResponse,
} from '../../../generated/graphql'
import { invariant } from '../../../util/invariant'
import { userInvariant } from '../../../util/user-invariant'
import { createOrUpdateIdentity } from '../../identity'
import { createIdentityIdentifierFromClaims } from '../mdoc/identifier-from-claims'
import { decodeAndValidateISO18013_7Response } from '../mdoc/iso18013-7'
import { decodeAndValidateOpenId4VpResponse } from '../mdoc/openid4vp'
import { mdocRequestDetailsCache } from '../mdoc/shared-config'

registerFeatureCheck(ProcessMDocPresentationResponseCommand, async (...[,]) => isMDocEnabled())

export async function ProcessMDocPresentationResponseCommand(
  this: CommandContext,
  { requestId, response, platform }: MDocPresentationResponseInput,
): Promise<MDocProcessedResponse> {
  const { user, entityManager } = this
  userInvariant(user)

  const requestDetails = await mdocRequestDetailsCache().get(requestId)
  invariant(requestDetails, `Request ID ${requestId} not found or expired`)

  // Verify the requesting user matches (security check)
  invariant(requestDetails.requestedById === user.entity.id, 'Request was created by a different user')

  const decodedResponse =
    platform === 'android'
      ? await decodeAndValidateOpenId4VpResponse(requestDetails, response)
      : await decodeAndValidateISO18013_7Response(requestDetails, response)
  invariant(
    decodedResponse.mDocDeviceResponse.status === 0,
    `Device response indicates failure with status ${decodedResponse.mDocDeviceResponse.status}`,
  )

  // Clean up request details from cache after successful processing
  await mdocRequestDetailsCache().delete(requestId)

  // Transform the mDoc device response into the GraphQL response format
  const documents: MDocDocument[] = decodedResponse.mDocDeviceResponse.documents.map((doc) => {
    const namespaces: MDocNamespace[] = []

    if (doc.issuerSigned?.nameSpaces) {
      for (const [namespace, items] of Object.entries(doc.issuerSigned.nameSpaces)) {
        const claims: MDocClaim[] = items.map((item) => ({
          elementIdentifier: item.issuerSignedItem.elementIdentifier,
          elementValue: item.issuerSignedItem.elementValue,
        }))

        namespaces.push({
          namespace,
          claims,
        })
      }
    }

    return {
      docType: doc.docType,
      namespaces,
    }
  })

  let identityId = requestDetails.identityId

  if (!requestDetails.identityId && requestDetails.requestedClaims.some((claim) => claim.useForIdentity)) {
    // TODO  (mdoc): Support multiple credentials - for now we only handle one
    const firstDocument = decodedResponse.mDocDeviceResponse.documents[0]
    invariant(firstDocument, 'Document response is missing')

    // Generate the identity identifier from the hashed claims
    const identityIdentifier = createIdentityIdentifierFromClaims(requestDetails.requestedClaims, firstDocument)
    invariant(identityIdentifier, 'Invalid identity identifier generated from claims')

    const identity = await createOrUpdateIdentity(entityManager, {
      issuer: requestDetails.docType,
      identifier: identityIdentifier,
      name: `${requestDetails.docType} Identity (${identityIdentifier.substring(0, 8)})`,
    })
    identityId = identity.id
  }

  return {
    requestId,
    documents,
    platform,
    identityId,
    diagnostics: decodedResponse.diagnostics,
  }
}
