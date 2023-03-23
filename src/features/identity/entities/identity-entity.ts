import { VerifiedOrchestrationEntity } from '../../../data'
import { Column, Entity, Index } from 'typeorm'
import { typeSafeAssign } from '../../../util/type-safe-assign'

@Entity('identity')
@Index(['issuer', 'identifier'], { unique: true })
export class IdentityEntity extends VerifiedOrchestrationEntity {
  constructor(args?: { issuer: string; identifier: string; name: string }) {
    super()
    if (!args) return
    typeSafeAssign(this, args)
  }

  @Column({ type: 'nvarchar' })
  issuer!: string

  @Column({ type: 'nvarchar' })
  identifier!: string

  @Column({ type: 'nvarchar' })
  name!: string
}
