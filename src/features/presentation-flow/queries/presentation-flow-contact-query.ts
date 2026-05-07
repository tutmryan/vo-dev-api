import type { QueryContext } from '../../../cqs'
import type { PresentationFlowContact } from '../../../generated/graphql'
import { PresentationFlowEntity } from '../entities/presentation-flow-entity'

export async function FindPresentationFlowContactQuery(
  this: QueryContext,
  presentationFlowId: string,
): Promise<PresentationFlowContact | null> {
  const entity = await this.entityManager.getRepository(PresentationFlowEntity).findOneBy({ id: presentationFlowId })

  if (!entity) return null

  // Only return contact info if the presentation flow is pending
  if (entity.isCancelled || entity.isSubmitted || entity.presentationId) {
    return null
  }

  return (await this.services.presentationFlows.downloadContact(presentationFlowId)) ?? null
}
