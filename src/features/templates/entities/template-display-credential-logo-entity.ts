import { Column, Entity } from 'typeorm'
import { VerifiedOrchestrationEntity } from '../../../data'
import { copyUnsetProps } from '../../../util/copy-props'
import { intersectingProps } from '../../../util/intersecting-props'
import { typeSafeAssign } from '../../../util/type-safe-assign'

@Entity('template_display_credential_logo')
export class TemplateDisplayCredentialLogoEntity extends VerifiedOrchestrationEntity {
  constructor(args: { uri: string | null; image: string | null; description: string | null }) {
    super()
    typeSafeAssign(this, args)
  }

  @Column({ type: 'nvarchar', nullable: true })
  uri!: string | null

  @Column({ type: 'nvarchar', nullable: true })
  image!: string | null

  @Column({ type: 'nvarchar', nullable: true })
  description!: string | null

  merge(child: TemplateDisplayCredentialLogoEntity) {
    copyUnsetProps(this, child, ['uri', 'image', 'description'])
  }

  checkOverrides(child: TemplateDisplayCredentialLogoEntity): string[] {
    return intersectingProps(this, child, ['uri', 'image', 'description'])
  }
}
