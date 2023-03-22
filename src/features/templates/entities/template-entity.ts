import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne } from 'typeorm'
import { VerifiedOrchestrationEntity } from '../../../data'
import { copyUnsetProps } from '../../../util/copy-props'
import { intersectingProps } from '../../../util/intersecting-props'
import { typeSafeAssign } from '../../../util/type-safe-assign'
import { TemplateDisplayEntity } from './template-display-entity'

export type CheckParentTemplateOverridesResult = { result: 'success' } | { result: 'failure'; errors: string[] }

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
  parent!: Promise<TemplateEntity | null>

  @OneToMany(() => TemplateEntity, (template) => template.parent)
  children!: Promise<TemplateEntity[]>

  @Column({ type: 'bit', nullable: true })
  isPublic!: boolean | null

  @Column({ type: 'int', nullable: true })
  validityIntervalInSeconds!: number | null

  @OneToOne(() => TemplateDisplayEntity, { nullable: false, cascade: true })
  @JoinColumn()
  display!: Promise<TemplateDisplayEntity>

  merge(child: TemplateEntity) {
    copyUnsetProps(this, child, ['isPublic', 'validityIntervalInSeconds'])
  }

  async getParentData(): Promise<{ parent: TemplateEntity; parentDisplay: TemplateDisplayEntity } | null> {
    let parent = await this.parent
    if (!parent) return null

    // build list of parents from leaf to root
    const parents = []
    while (parent) {
      parents.push(parent)
      parent = await parent.parent
    }

    const root = parents.pop()!
    const rootDisplay = await root.display

    const ancestors = parents.reverse()
    for (const next of ancestors) {
      root.merge(next)
      rootDisplay.merge(await next.display)
    }

    return {
      parent: root,
      parentDisplay: rootDisplay,
    }
  }

  async checkParentOverrides(): Promise<CheckParentTemplateOverridesResult> {
    const parentData = await this.getParentData()
    if (!parentData) return { result: 'success' }

    const { parent, parentDisplay } = parentData
    const parentErrors = parent.checkOverrides(this)
    const parentDisplayErrors = parentDisplay.checkOverrides(await this.display).map((x) => `display.${x}`)

    const allErrors = [...parentErrors, ...parentDisplayErrors]
    return allErrors.length > 0 ? { result: 'failure', errors: allErrors } : { result: 'success' }
  }

  private checkOverrides(child: TemplateEntity): string[] {
    return intersectingProps(this, child, ['isPublic', 'validityIntervalInSeconds'])
  }
}
