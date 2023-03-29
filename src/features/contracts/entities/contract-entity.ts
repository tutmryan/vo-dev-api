import { Column, Entity, ManyToOne } from 'typeorm'
import { TemplateEntity } from '../../templates/entities/template-entity'
import type { ContractDisplayModel, TemplateParentData } from '../../../generated/graphql'
import { typeSafeAssign } from '../../../util/type-safe-assign'
import { toTemplateParentData } from '../../templates/mapping'
import { isEqual, merge, uniq } from 'lodash'
import { domainInvariant } from '../../../util/domain-invariant'
import { TrackedEntity } from '../../tracking/entities/tracked-entity'

@Entity('contract')
export class ContractEntity extends TrackedEntity {
  constructor(args?: {
    name: string
    description: string
    template: TemplateEntity | null
    isPublic: boolean
    validityIntervalInSeconds: number
    credentialTypes: string[]
    display: ContractDisplayModel
  }) {
    super()
    if (!args) return
    const { template, ...rest } = args
    typeSafeAssign(this, { ...rest, template: Promise.resolve(template) })
  }

  @Column({ type: 'nvarchar' })
  name!: string

  @Column({ type: 'nvarchar' })
  description!: string

  @ManyToOne(() => TemplateEntity, { nullable: true })
  template!: Promise<TemplateEntity | null>

  @Column({ nullable: true })
  templateId!: string | null

  @Column({ type: 'bit', nullable: false })
  isPublic!: boolean

  @Column({ type: 'int', nullable: false })
  validityIntervalInSeconds!: number

  @Column({ type: 'nvarchar', length: 'MAX' })
  private displayJson!: string

  get display(): ContractDisplayModel {
    return JSON.parse(this.displayJson)
  }

  set display(display: ContractDisplayModel) {
    this.displayJson = JSON.stringify(display)
  }

  @Column({ type: 'nvarchar', length: 'MAX' })
  private credentialTypesJson!: string

  get credentialTypes(): string[] {
    return JSON.parse(this.credentialTypesJson)
  }

  set credentialTypes(credentialTypes: string[]) {
    domainInvariant(credentialTypes.length !== 0, 'At least one credential type is required')
    domainInvariant(isEqual(credentialTypes, uniq(credentialTypes)), 'Credential types need to be unique')

    this.credentialTypesJson = JSON.stringify(credentialTypes)
  }

  async templateData(): Promise<TemplateParentData | undefined> {
    const template = await this.template
    if (!template) return undefined

    const templateParentData = await template.parentData()
    if (!templateParentData) return toTemplateParentData(template)

    return merge(templateParentData, toTemplateParentData(template))
  }

  async update(input: Pick<ContractEntity, 'name' | 'description' | 'isPublic' | 'validityIntervalInSeconds' | 'display'>) {
    typeSafeAssign(this, input)
  }
}
