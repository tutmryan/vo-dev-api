import { Column, Entity } from 'typeorm'
import { VerifiedOrchestrationEntity } from '../../../data'
import { copyUnsetProps } from '../../../util/copy-props'
import { intersectingProps } from '../../../util/intersecting-props'
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
    copyUnsetProps(this, child, ['title', 'instructions'])
  }

  checkOverrides(child: TemplateDisplayConsentEntity): string[] {
    return intersectingProps(this, child, ['title', 'instructions'])
  }
}
