import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne } from 'typeorm'
import { VerifiedOrchestrationEntity } from '../../../data'
import { typeSafeAssign } from '../../../util/type-safe-assign'
import { TemplateDisplayEntity } from './template-display-entity'

@Entity('template')
export class TemplateEntity extends VerifiedOrchestrationEntity {
  constructor(args?: {
    name: string
    description: string
    parent: TemplateEntity | null
    isPublic: boolean | null
    validityIntervalInSeconds: number | null
    display: TemplateDisplayEntity
  }) {
    super()
    if (!args) return
    const { parent, display, ...rest } = args
    typeSafeAssign(this, { ...rest, parent: Promise.resolve(parent), display: Promise.resolve(display) })
  }

  @Column({ type: 'nvarchar' })
  name!: string

  @Column({ type: 'nvarchar' })
  description!: string

  @ManyToOne(() => TemplateEntity, { nullable: true })
  parent?: Promise<TemplateEntity | null>

  @OneToMany(() => TemplateEntity, (template) => template.parent)
  children?: Promise<TemplateEntity[]>

  @Column({ type: 'bit', nullable: true })
  isPublic!: boolean | null

  @Column({ type: 'int', nullable: true })
  validityIntervalInSeconds!: number | null

  @OneToOne(() => TemplateDisplayEntity, { nullable: false, cascade: true })
  @JoinColumn()
  display!: Promise<TemplateDisplayEntity>

  async merge(child: TemplateEntity) {
    if (this.isPublic === null) this.isPublic = child.isPublic
    if (!this.validityIntervalInSeconds) this.validityIntervalInSeconds = child.validityIntervalInSeconds
  }
}
