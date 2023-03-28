import { merge } from 'lodash'
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm'
import { VerifiedOrchestrationEntity } from '../../../data'
import type { TemplateDisplayModel, TemplateParentData } from '../../../generated/graphql'
import { typeSafeAssign } from '../../../util/type-safe-assign'
import { ensureNoIntersectingTemplateData, toTemplateParentData } from '../mapping'
import { ContractEntity } from '../../contracts/entities/contract-entity'

@Entity('template')
export class TemplateEntity extends VerifiedOrchestrationEntity {
  constructor(args?: {
    name: string
    description: string
    parent: TemplateEntity | null
    isPublic: boolean | null
    validityIntervalInSeconds: number | null
    display: TemplateDisplayModel | null
  }) {
    super()
    if (!args) return
    const { parent, ...rest } = args
    typeSafeAssign(this, { ...rest, parent: Promise.resolve(parent) })
  }

  @Column({ type: 'nvarchar' })
  name!: string

  @Column({ type: 'nvarchar' })
  description!: string

  @ManyToOne(() => TemplateEntity, { nullable: true })
  parent!: Promise<TemplateEntity | null>

  @OneToMany(() => TemplateEntity, (template) => template.parent)
  children!: Promise<TemplateEntity[]>

  @OneToMany(() => ContractEntity, (contract) => contract.template)
  contracts!: Promise<ContractEntity[]>

  @Column({ type: 'bit', nullable: true })
  isPublic!: boolean | null

  @Column({ type: 'int', nullable: true })
  validityIntervalInSeconds!: number | null

  @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
  private displayJson?: string | null

  get display(): TemplateDisplayModel | null {
    return this.displayJson ? JSON.parse(this.displayJson) : null
  }
  set display(display: TemplateDisplayModel | null) {
    this.displayJson = display ? JSON.stringify(display) : null
  }

  private async getAncestors(): Promise<TemplateEntity[]> {
    let parent = await this.parent
    if (!parent) return []

    const ancestors = []
    while (parent) {
      ancestors.push(parent)
      parent = await parent.parent
    }

    return ancestors
  }

  async parentData(): Promise<TemplateParentData | undefined> {
    const ancestors = await this.getAncestors()
    if (ancestors.length == 0) return undefined
    return merge({}, ...ancestors.map(toTemplateParentData))
  }

  async combinedData(): Promise<TemplateParentData> {
    const parentData = await this.parentData()
    if (!parentData) return toTemplateParentData(this)

    return merge(parentData, toTemplateParentData(this))
  }

  async update(input: Pick<TemplateEntity, 'name' | 'description' | 'isPublic' | 'validityIntervalInSeconds' | 'display'>) {
    const parentTemplateData = await this.parentData()
    if (parentTemplateData) {
      ensureNoIntersectingTemplateData(toTemplateParentData(input), parentTemplateData)
    }
    typeSafeAssign(this, input)
  }
}
