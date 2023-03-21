import { Column, Entity } from 'typeorm'
import { VerifiedOrchestrationEntity } from '../../../data'
import { typeSafeAssign } from '../../../util/type-safe-assign'

@Entity('template_display_consent')
export class TemplateDisplayConsentEntity extends VerifiedOrchestrationEntity {
  constructor(args: { title: string | null; instructions: string | null }) {
    super()
    typeSafeAssign(this, args)
  }

  @Column({ type: 'nvarchar', nullable: true })
  title!: string | null

  @Column({ type: 'nvarchar', nullable: true })
  instructions!: string | null

  merge(child: TemplateDisplayConsentEntity) {
    if (!this.title) this.title = child.title
    if (!this.instructions) this.instructions = child.instructions
  }
}
