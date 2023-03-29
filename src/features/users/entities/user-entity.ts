import { Column, Entity, Index } from 'typeorm'
import { typeSafeAssign } from '../../../util/type-safe-assign'
import { VerifiedOrchestrationEntity } from '../../../data/verified-orchestration-entity'

export type UpdateIdentityInput = Pick<UserEntity, 'email' | 'name'>

@Entity('user')
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
