import type { CommandContext } from '../../../cqs'
import { invariant } from '../../../util/invariant'
import { notifyIdentityStoreChanged } from '../../instance-configs'
import { IdentityStoreEntity } from '../entities/identity-store-entity'

export async function ResumeIdentityStoreCommand(this: CommandContext, id: string) {
  const repo = this.entityManager.getRepository(IdentityStoreEntity)
  const identityStore = await repo.findOne({ where: { id }, withDeleted: true })
  invariant(identityStore, 'IdentityStore not found')
  const recoveredIdentityStore = await repo.recover(identityStore, { reload: true })
  notifyIdentityStoreChanged()
  return recoveredIdentityStore
}
