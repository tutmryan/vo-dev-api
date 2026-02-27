import type { QueryContext } from '../../../cqs'
import type { ActionedPresentationFlowData } from '../../../generated/graphql'
import { PresentationFlowStatus } from '../../../generated/graphql'
import { PresentationFlowEntity } from '../entities/presentation-flow-entity'

export async function FindActionedPresentationFlowDataQuery(this: QueryContext, id: string): Promise<ActionedPresentationFlowData | null> {
  const presentationFlow = await this.entityManager.getRepository(PresentationFlowEntity).findOneByOrFail({ id })

  const terminalStatuses = [PresentationFlowStatus.Submitted, PresentationFlowStatus.Cancelled]
  if (!terminalStatuses.includes(presentationFlow.status)) return null

  const presentation = await presentationFlow.presentation
  const identity = presentation ? await presentation.identity : null

  return {
    presentationFlowId: presentationFlow.id,
    correlationId: presentationFlow.correlationId,
    requestData: presentationFlow.requestData,
    state: presentationFlow.callback ? presentationFlow.callback.state : null,
    status: presentationFlow.status,
    presentationId: presentationFlow.presentationId,
    dataResults: presentationFlow.dataResults,
    actionKey: presentationFlow.actionKey,
    submittedAt: presentationFlow.updatedAt,
    submittedBy: identity ? { id: identity.id, name: identity.name } : null,
    callbackSecret: presentationFlow.callbackSecret,
  }
}
