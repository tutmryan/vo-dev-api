import { Column, Entity, JoinColumn, OneToOne } from 'typeorm'
import { VerifiedOrchestrationEntity } from '../../../data'
import { copyUnsetProps } from '../../../util/copy-props'
import { intersectingProps } from '../../../util/intersecting-props'
import { typeSafeAssign } from '../../../util/type-safe-assign'
import { TemplateDisplayCredentialLogoEntity } from './template-display-credential-logo-entity'

@Entity('template_display_credential')
export class TemplateDisplayCredentialEntity extends VerifiedOrchestrationEntity {
  constructor(args: {
    title: string | null
    issuedBy: string | null
    backgroundColor: string | null
    textColor: string | null
    description: string | null
    logo: TemplateDisplayCredentialLogoEntity
  }) {
    super()
    typeSafeAssign(this, args)
  }

  @Column({ type: 'nvarchar', nullable: true })
  title!: string | null

  @Column({ type: 'nvarchar', nullable: true })
  issuedBy!: string | null

  @Column({ type: 'nvarchar', length: 7, nullable: true })
  backgroundColor!: string | null

  @Column({ type: 'nvarchar', length: 7, nullable: true })
  textColor!: string | null

  @Column({ type: 'nvarchar', nullable: true })
  description!: string | null

  @OneToOne(() => TemplateDisplayCredentialLogoEntity, { nullable: false, cascade: true, eager: true })
  @JoinColumn()
  logo!: TemplateDisplayCredentialLogoEntity

  merge(child: TemplateDisplayCredentialEntity) {
    copyUnsetProps(this, child, ['title', 'issuedBy', 'backgroundColor', 'textColor', 'description'])
    this.logo.merge(child.logo)
  }

  checkOverrides(child: TemplateDisplayCredentialEntity): string[] {
    const errors = intersectingProps(this, child, ['title', 'issuedBy', 'backgroundColor', 'textColor', 'description']) as string[]
    errors.push(...this.logo.checkOverrides(child.logo).map((x) => `logo.${x}`))
    return errors
  }
}
