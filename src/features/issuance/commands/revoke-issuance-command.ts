import type { CommandContext } from '../../../cqrs/command-context'
import { invariant } from '../../../util/invariant'
import { userInvariant } from '../../../util/user-invariant'
import { IssuanceEntity } from '../entities/issuance-entity'

export async function RevokeIssuanceCommand(this: CommandContext, id: string) {
  const {
    user,
    entityManager,
    services: { admin },
  } = this

  userInvariant(user)

  const issuanceRepository = entityManager.getRepository(IssuanceEntity)
  const issuance = await issuanceRepository.findOneByOrFail({ id })

  // if the issuance has been previously revoked, we don't need to proceed further
  if (issuance.isRevoked) return issuance

  const contractExternalId = (await issuance.contract).externalId
  invariant(contractExternalId, 'Contract must have been provisioned for an issuance to exist')

  const credential = await admin.findCredential(contractExternalId, issuance.id)
  invariant(credential, 'Credential with issuance id as an index claim could not be found')

  await admin.revokeCredential(contractExternalId, credential.id)

  issuance.markAsRevoked(user.userEntity)
  return await issuanceRepository.save(issuance)
}
