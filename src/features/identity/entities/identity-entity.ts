import { Column, Entity, Index } from 'typeorm'
import { typeSafeAssign } from '../../../util/type-safe-assign'
import { AuditedAndTrackedEntity } from '../../auditing/entities/audited-and-tracked-entity'

export const identityColumnsOf = (fields: (keyof IdentityEntity)[]) => fields

@Entity('identity')
@Index(['issuer', 'identifier'], { unique: true })
export class IdentityEntity extends AuditedAndTrackedEntity {
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
