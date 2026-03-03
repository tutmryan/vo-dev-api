import { AuditEvents } from '../../../audit-types'
import type { CommandContext } from '../../../cqs'
import { IdentityEntity } from '../../identity/entities/identity-entity'
import { microsoftEntraTemporaryAccessPassService } from '../microsoft-entra-temporary-access-pass-service'

export async function SelfIssueMicrosoftEntraTemporaryAccessPassCommand(this: CommandContext) {
  const entity = this.user?.entity
  if (!entity || !(entity instanceof IdentityEntity)) {
    throw new Error('User not authenticated or is not an Identity.')
  }

  const tap = await microsoftEntraTemporaryAccessPassService.issueTemporaryAccessPass(entity)

  this.logger.auditEvent(AuditEvents.MICROSOFT_ENTRA_TEMPORARY_ACCESS_PASS_SELF_ISSUED, {
    targetIdentityId: entity.id,
    temporaryAccessPassId: tap.id,
  })

  return {
    id: tap.id,
    externalId: tap.id,
    value: tap.temporaryAccessPass,
    temporaryAccessPass: tap.temporaryAccessPass,
    lifetimeInMinutes: tap.lifetimeInMinutes,
    isUsableOnce: tap.isUsableOnce,
    createdDateTime: new Date(tap.createdDateTime),
    startDateTime: new Date(tap.startDateTime),
    methodUsabilityReason: tap.methodUsabilityReason,
  }
}
