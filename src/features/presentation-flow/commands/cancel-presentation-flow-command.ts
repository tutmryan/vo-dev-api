import { AuditEvents } from '../../../audit-types'
import { addToJobQueue } from '../../../background-jobs'
import type { CommandContext } from '../../../cqs'
import { PresentationFlowStatus } from '../../../generated/graphql'
import { invariant } from '../../../util/invariant'
import { userInvariant } from '../../../util/user-invariant'
import { PresentationFlowEntity } from '../entities/presentation-flow-entity'
import { publishPresentationFlowEvent } from '../pubsub'

export async function CancelPresentationFlowCommand(this: CommandContext, id: string) {
  const { user, entityManager, logger } = this
  userInvariant(user)

  const repo = entityManager.getRepository(PresentationFlowEntity)
  const request = await repo.findOneBy({ id })
  invariant(request, `Presentation flow for ${id} not found`)

  const cancellableStatuses: PresentationFlowStatus[] = [
    PresentationFlowStatus.Pending,
    PresentationFlowStatus.RequestCreated,
    PresentationFlowStatus.RequestRetrieved,
  ]
  invariant(
    cancellableStatuses.includes(request.status),
    `Presentation flow ${request.id} is in a ${request.status} state. Only pending requests can be cancelled.`,
  )

  request.isCancelled = true
  await repo.save(request)
  await publishPresentationFlowEvent(request.id)

  logger.auditEvent(AuditEvents.PRESENTATION_FLOW_CANCELLED, {
    presentationFlowId: request.id,
    userId: user.entity.id,
  })

  if (request.callback) {
    await addToJobQueue('invokePresentationFlowCallback', { userId: user.entity.id, presentationFlowId: request.id })
  }
}
