import { AuditEvents } from '../../../audit-types'
import type { CommandContext } from '../../../cqs'
import { userInvariant } from '../../../util/user-invariant'
import { AsyncIssuanceEntity } from '../../async-issuance/entities/async-issuance-entity'
import { CredentialRecordEntity } from '../../credential-record/entities/credential-record-entity'
import { IssuanceEntity } from '../entities/issuance-entity'

export async function CancelIssuanceRequestCommand(this: CommandContext, credentialRecordId: string): Promise<boolean> {
  const { user, entityManager, logger } = this

  userInvariant(user)

  logger.mergeMeta({ credentialRecordId })

  const repo = entityManager.getRepository(CredentialRecordEntity)
  const record = await repo.findOneByOrFail({ id: credentialRecordId })

  // Already cancelled — idempotent
  if (record.cancelledAt) return true

  const issuance = await entityManager.getRepository(IssuanceEntity).findOneBy({ credentialRecordId })
  if (issuance) throw new Error('Cannot cancel: the credential offer has already been redeemed')

  const asyncIssuance = await entityManager.getRepository(AsyncIssuanceEntity).findOneBy({ credentialRecordId })
  if (asyncIssuance) throw new Error('Cannot cancel: the credential record belongs to an async issuance request')

  record.cancelledAt = new Date()
  await repo.save(record)

  logger.auditEvent(AuditEvents.ISSUANCE_REQUEST_CANCELLED, { credentialRecordId })

  return true
}
