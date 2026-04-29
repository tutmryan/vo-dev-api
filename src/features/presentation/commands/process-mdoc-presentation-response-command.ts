import type { CommandContext } from '../../../cqs'
import { isMDocPresentationsEnabled, registerFeatureCheck } from '../../../cqs/feature-map'
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
import { PresentationFlowEntity } from '../../presentation-flow/entities/presentation-flow-entity'
import { PresentationEntity } from '../entities/presentation-entity'
import { createIdentityIdentifierFromClaims } from '../mdoc/identifier-from-claims'
import { decodeAndValidateISO18013_7Response } from '../mdoc/protocols/orgIsoMdoc'
import { mdocRequestDetailsCache } from '../mdoc/shared-config'

export type MDocProcessedResponseWithMeta = MDocProcessedResponse & { _presentationFlowId?: string }

registerFeatureCheck(ProcessMDocPresentationResponseCommand, async (...[,]) => isMDocPresentationsEnabled())

export async function ProcessMDocPresentationResponseCommand(
  this: CommandContext,
  { requestId, response }: MDocPresentationResponseInput,
): Promise<MDocProcessedResponseWithMeta> {
  const { user, entityManager } = this
  userInvariant(user)

  const requestDetails = await mdocRequestDetailsCache().get(requestId)
  invariant(requestDetails, `Request ID ${requestId} not found or expired`)

  // Verify the requesting user matches (security check)
  invariant(requestDetails.requestedById === user.entity.id, 'Request was created by a different user')

  // For limited presentation-flow tokens, verify the request belongs to the token's flow
  if (user.limitedPresentationFlowData?.presentationFlowId) {
    invariant(
      requestDetails.presentationFlowId === user.limitedPresentationFlowData.presentationFlowId,
      'Request does not belong to the presentation flow associated with this token',
    )
  }

  const decodedResponse = await decodeAndValidateISO18013_7Response(requestDetails, response)
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

  // If this was triggered by a presentation flow, link the result to it.
  // This mirrors the VC callback path in presentation-callback-handler.ts.
  if (requestDetails.presentationFlowId) {
    const presentationEntity = new PresentationEntity({
      requestId,
      requestedById: requestDetails.requestedById,
      identityId: identityId ?? null,
      issuanceIds: [],
      requestedCredentials: [],
      presentedCredentials: [],
      partnerIds: [],
    })
    const { id: presentationId } = await entityManager.getRepository(PresentationEntity).save(presentationEntity)

    const flowRepo = entityManager.getRepository(PresentationFlowEntity)
    const flow = await flowRepo.findOneByOrFail({ id: requestDetails.presentationFlowId })
    flow.presentationId = presentationId

    const hasDataSchema = flow.dataSchema && flow.dataSchema.length > 0
    const hasActions = flow.actions && flow.actions.length > 0
    // For mDoc flows the dataSchema is display-only, so we still auto-submit
    // unless explicitly disabled. For VC flows, a dataSchema or actions means a manual submit step.
    const shouldAutoSubmit = flow.type === 'mdoc' ? flow.autoSubmit !== false : !hasDataSchema && !hasActions && flow.autoSubmit !== false
    if (shouldAutoSubmit) flow.isSubmitted = true

    await flowRepo.save(flow)

    // Return the flowId so the resolver can publish the event AFTER the transaction
    // commits — publishing inside the transaction causes a race where the admin
    // refetches before the committed data is visible (READ COMMITTED isolation).
    return {
      requestId,
      documents,
      identityId,
      diagnostics: decodedResponse.diagnostics,
      _presentationFlowId: requestDetails.presentationFlowId,
    }
  }

  return {
    requestId,
    documents,
    identityId,
    diagnostics: decodedResponse.diagnostics,
  }
}
