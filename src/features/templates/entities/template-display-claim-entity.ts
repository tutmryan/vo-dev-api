import { Column, Entity, ManyToOne } from 'typeorm'
import { VerifiedOrchestrationEntity } from '../../../data'
import { typeSafeAssign } from '../../../util/type-safe-assign'
import { TemplateDisplayEntity } from './template-display-entity'

@Entity('template_display_claim')
export class TemplateDisplayClaimEntity extends VerifiedOrchestrationEntity {
  constructor(args: { label: string; claim: string; type: string; description: string | null; value: string | null }) {
    super()
    typeSafeAssign(this, args)
  }

  @Column({ type: 'nvarchar' })
  label!: string

  @Column({ type: 'nvarchar' })
  claim!: string

  @Column({ type: 'nvarchar' })
  type!: string

  @Column({ type: 'nvarchar', nullable: true })
  description!: string | null

  @Column({ type: 'nvarchar', nullable: true })
  value!: string | null

  @ManyToOne(() => TemplateDisplayEntity, (x) => x.claims, { nullable: false })
  display?: TemplateDisplayEntity
}
