import type { CommandContext } from '../../../cqrs/command-context'
import type { VerifiedOrchestrationEntityManager } from '../../../data/entity-manager'
import type { AdminService } from '../../../services/admin'
import { invariant } from '../../../util/invariant'
import { userInvariant } from '../../../util/user-invariant'
import type { UserEntity } from '../../users/entities/user-entity'
import { IssuanceEntity } from '../entities/issuance-entity'

export async function RevokeIssuanceCommand(this: CommandContext, id: string) {
  const {
    user,
    entityManager,
    services: { admin },
  } = this

  userInvariant(user)
  return revokeIssuance(entityManager, admin, user.userEntity, id)
}

export async function revokeIssuance(
  entityManager: VerifiedOrchestrationEntityManager,
  admin: AdminService,
  userEntity: UserEntity,
  id: string,
): Promise<IssuanceEntity> {
  const issuanceRepository = entityManager.getRepository(IssuanceEntity)
  const issuance = await issuanceRepository.findOneByOrFail({ id })

  // if the issuance has been previously revoked, we don't need to proceed further
  if (issuance.isRevoked) return issuance

  const contractExternalId = (await issuance.contract).externalId
  invariant(contractExternalId, 'Contract must have been provisioned for an issuance to exist')

  const credential = await admin.findCredential(contractExternalId, issuance.id)
  invariant(credential, 'Credential with issuance id as an index claim could not be found')

  await admin.revokeCredential(contractExternalId, credential.id)

  issuance.markAsRevoked(userEntity)
  return await issuanceRepository.save(issuance)
}
