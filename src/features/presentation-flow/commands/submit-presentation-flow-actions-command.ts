import { AuditEvents } from '../../../audit-types'
import { addToJobQueue } from '../../../background-jobs'
import type { CommandContext } from '../../../cqs'
import type { SubmitActionsInput } from '../../../generated/graphql'
import { PresentationFlowStatus } from '../../../generated/graphql'
import { invariant } from '../../../util/invariant'
import { userInvariant } from '../../../util/user-invariant'
import { PresentationFlowEntity } from '../entities/presentation-flow-entity'
import { publishPresentationFlowEvent } from '../pubsub'

export async function SubmitPresentationFlowActionsCommand(this: CommandContext, id: string, input: SubmitActionsInput) {
  const { user, entityManager, logger } = this
  userInvariant(user)

  const repo = entityManager.getRepository(PresentationFlowEntity)
  const request = await repo.findOneByOrFail({ id })

  invariant(request.status === PresentationFlowStatus.PresentationVerified, 'Presentation flow is not in a valid state')
  invariant(!request.isCancelled, 'Presentation flow is cancelled')
  invariant(request.expiresAt.getTime() >= Date.now(), 'Presentation flow is expired')
  invariant(!request.isSubmitted, 'Presentation flow is already submitted')

  const schema = request.dataSchema
  if (schema && schema.length > 0) {
    const results = (input.dataResults ?? {}) as Record<string, unknown>
    const schemaIds = new Set(schema.map((a) => a.id))

    for (const key of Object.keys(results)) {
      invariant(schemaIds.has(key), `Unknown data field ID: ${key}`)
    }

    for (const field of schema) {
      const value = results[field.id]

      if (field.required && field.type !== 'boolean') {
        invariant(value !== null && value !== undefined, `"${field.label}" is required`)
        if (typeof value === 'string') invariant(value.trim().length > 0, `"${field.label}" is required`)
        if (Array.isArray(value)) invariant(value.length > 0, `"${field.label}" requires at least one selection`)
      }

      if (field.type === 'number' && value !== null && value !== undefined) {
        const num = Number(value)
        invariant(!isNaN(num), `"${field.label}" must be a number`)
        if (field.constraints?.min != null)
          invariant(num >= field.constraints.min, `"${field.label}" must be at least ${field.constraints.min}`)
        if (field.constraints?.max != null)
          invariant(num <= field.constraints.max, `"${field.label}" must be at most ${field.constraints.max}`)
      }

      if (field.type === 'text' && typeof value === 'string' && value.length > 0) {
        if (field.constraints?.minLength != null)
          invariant(
            value.length >= field.constraints.minLength,
            `"${field.label}" must be at least ${field.constraints.minLength} characters`,
          )
        if (field.constraints?.maxLength != null)
          invariant(
            value.length <= field.constraints.maxLength,
            `"${field.label}" must be at most ${field.constraints.maxLength} characters`,
          )
        if (field.constraints?.pattern != null) {
          let regex: RegExp | undefined
          try {
            regex = new RegExp(field.constraints.pattern)
          } catch {
            // invalid regex in schema, skip
          }

          if (regex) {
            invariant(regex.test(value), `"${field.label}" does not match the required pattern`)
          }
        }
      }

      if (field.type === 'select' && field.options) {
        const validIds = new Set(field.options.map((o) => o.id))
        if (Array.isArray(value)) {
          for (const id of value) invariant(validIds.has(id as string), `"${field.label}" contains an invalid option`)
        } else if (typeof value === 'string' && value) {
          invariant(validIds.has(value), `"${field.label}" contains an invalid option`)
        }
      }
    }
  }

  const actions = request.actions
  if (input.actionKey) {
    invariant(actions && actions.some((a) => a.key === input.actionKey), `Unknown action key: ${input.actionKey}`)
  }

  const defaultActionKey = !actions?.length && request.autoSubmit === false ? 'SUBMIT' : null

  request.dataResultsJson = input.dataResults ? JSON.stringify(input.dataResults) : null
  request.actionKey = input.actionKey ?? defaultActionKey
  request.isSubmitted = true

  await repo.save(request)
  await publishPresentationFlowEvent(request.id)

  logger.auditEvent(AuditEvents.PRESENTATION_FLOW_SUBMITTED, {
    presentationFlowId: request.id,
    userId: user.entity.id,
    actionKey: request.actionKey,
    hasDataResults: !!request.dataResultsJson,
  })

  if (request.callback) {
    await addToJobQueue('invokePresentationFlowCallback', { userId: user.entity.id, presentationFlowId: request.id })
  }

  return request
}
