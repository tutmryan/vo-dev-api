import { entityManager } from '../../data'
import type { SubscriptionPresentationFlowEventArgs } from '../../generated/graphql'
import { pubsub } from '../../redis/pubsub'
import { PresentationFlowEntity } from './entities/presentation-flow-entity'

const PRESENTATION_FLOW_TOPIC = 'presentationFlow'

export const publishPresentationFlowEvent = async (presentationFlowId: string): Promise<void> => {
  pubsub().publish(`${PRESENTATION_FLOW_TOPIC}.${presentationFlowId}`, { presentationFlowId })
}

export const subscribeToPresentationFlowEvents = (_: unknown, args: SubscriptionPresentationFlowEventArgs) => {
  const iterator = pubsub().asyncIterator(`${PRESENTATION_FLOW_TOPIC}.${args.id}`)
  return { ...iterator, [Symbol.asyncIterator]: () => iterator }
}

export const resolvePresentationFlowEvent = ({ presentationFlowId }: { presentationFlowId: string }) =>
  entityManager.getRepository(PresentationFlowEntity).findOneOrFail({ where: { id: presentationFlowId } })
