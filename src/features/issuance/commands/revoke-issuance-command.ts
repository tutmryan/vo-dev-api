import type { CommandContext } from '../../../cqs'
import { IssuanceStatus } from '../../../generated/graphql'
import { invariant } from '../../../util/invariant'
import { userInvariant } from '../../../util/user-invariant'
import { IssuanceEntity } from '../entities/issuance-entity'
import { auditLogRevocation } from '../jobs/revoke-utils'

export async function RevokeIssuanceCommand(this: CommandContext, id: string) {
  const {
    user,
    entityManager,
    services: { verifiedIdAdmin },
    logger,
  } = this

  userInvariant(user)

  const issuanceRepository = entityManager.getRepository(IssuanceEntity)
  const issuance = await issuanceRepository.findOneByOrFail({ id })

  // if the issuance has been previously revoked, we don't need to proceed further
  if (issuance.isRevoked) return issuance

  const contractExternalId = (await issuance.contract).externalId
  invariant(contractExternalId, 'Contract must have been provisioned for an issuance to exist')

  const credential = await verifiedIdAdmin.findCredential(contractExternalId, issuance.id)
  if (!credential && issuance.status === IssuanceStatus.Expired) {
    logger.warn(`Expired credential with issuance id ${issuance.id} could not be found`)
    return issuance
  }

  invariant(credential, 'Credential with issuance id as an index claim could not be found')
  await verifiedIdAdmin.revokeCredential(contractExternalId, credential.id)

  issuance.markAsRevoked(user.entity)
  auditLogRevocation(logger, issuance)
  return await issuanceRepository.save(issuance)
}
