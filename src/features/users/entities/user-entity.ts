import { Column, Entity, Index } from 'typeorm'
import { homeTenant } from '../../../config'
import { VerifiedOrchestrationEntity } from '../../../data/verified-orchestration-entity'
import { typeSafeAssign } from '../../../util/type-safe-assign'

export type UpdateIdentityInput = Pick<UserEntity, 'email' | 'name'>

@Entity('user', { orderBy: { name: 'ASC', email: 'ASC' } })
@Index(['tenantId', 'oid'], { unique: true })
export class UserEntity extends VerifiedOrchestrationEntity {
  constructor(args?: { oid: string; tenantId: string; email: string | null; name: string; isApp: boolean }) {
    super()
    if (args) typeSafeAssign(this, args)
  }

  @Column({ type: 'uniqueidentifier' })
  oid!: string

  @Column({ type: 'uniqueidentifier' })
  tenantId!: string

  @Column({ type: 'nvarchar', nullable: true })
  email!: string | null

  @Column({ type: 'nvarchar' })
  name!: string

  @Column({ type: 'bit' })
  isApp!: boolean

  update(input: UpdateIdentityInput): boolean {
    const { email: newEmail, name: newName } = input
    const { email: existingEmail, name: existingName } = this

    if (newEmail !== existingEmail || newName !== existingName) {
      typeSafeAssign(this, input)
      return true
    }

    return false
  }
}

export const SYSTEM_USER_OID = 'faa690ac-d8d0-4ff8-aa38-2a9c53084ca9'

export function createSystemUser() {
  return new UserEntity({
    oid: SYSTEM_USER_OID,
    tenantId: homeTenant.tenantId,
    email: null,
    name: 'System',
    isApp: true,
  })
}
