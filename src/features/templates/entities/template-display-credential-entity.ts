import { Column, Entity, JoinColumn, OneToOne } from 'typeorm'
import { VerifiedOrchestrationEntity } from '../../../data'
import { invariant } from '../../../util/invariant'
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
  logo?: TemplateDisplayCredentialLogoEntity

  merge(child: TemplateDisplayCredentialEntity) {
    invariant(this.logo, 'this.logo must be loaded')
    invariant(child.logo, 'child.logo must be loaded')

    if (!this.title) this.title = child.title
    if (!this.issuedBy) this.issuedBy = child.issuedBy
    if (!this.backgroundColor) this.backgroundColor = child.backgroundColor
    if (!this.textColor) this.textColor = child.textColor
    if (!this.description) this.description = child.description

    this.logo.merge(child.logo)
  }
}
