import { Column, Entity, Index } from 'typeorm'
import { booleanType, nvarcharType } from '../../../data/utils/crossDbColumnTypes'
import { uuidLowerCaseTransformer } from '../../../data/utils/uuidLowerCaseTransformer'
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

  @Column({ type: 'uuid', transformer: uuidLowerCaseTransformer })
  oid!: string

  @Column({ type: 'uuid', transformer: uuidLowerCaseTransformer })
  tenantId!: string

  @Column({ type: nvarcharType, nullable: true })
  email!: string | null

  @Column({ type: nvarcharType })
  name!: string

  @Column({ type: booleanType })
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
export const SYSTEM_USER_ID = SYSTEM_USER_OID
