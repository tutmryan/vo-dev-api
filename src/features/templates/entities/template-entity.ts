import { compact, flatten, isEqual, merge, uniq } from 'lodash'
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm'
import type { TemplateDisplayClaim, TemplateDisplayModel, TemplateParentData } from '../../../generated/graphql'
import { domainInvariant } from '../../../util/domain-invariant'
import { Lazy } from '../../../util/lazy'
import { typeSafeAssign } from '../../../util/type-safe-assign'
import { AuditedAndTrackedEntity } from '../../auditing/entities/audited-and-tracked-entity'
import { ContractEntity } from '../../contracts/entities/contract-entity'
import { ensureNoIntersectingTemplateData, toTemplateParentData } from '../mapping'

@Entity('template', { orderBy: { createdAt: 'ASC' } })
export class TemplateEntity extends AuditedAndTrackedEntity {
  constructor(args?: {
    name: string
    description: string
    parent: TemplateEntity | null
    isPublic: boolean | null
    validityIntervalInSeconds: number | null
    credentialTypes: string[] | null
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

  @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
  private credentialTypesJson!: string | null

  get credentialTypes(): string[] | null {
    return this.credentialTypesJson ? JSON.parse(this.credentialTypesJson) : null
  }

  set credentialTypes(credentialTypes: string[] | null) {
    if (credentialTypes) {
      domainInvariant(isEqual(credentialTypes, uniq(credentialTypes)), 'Credential types need to be unique')
      this.credentialTypesJson = JSON.stringify(credentialTypes)
    } else this.credentialTypesJson = null
  }

  private getAncestors: () => Promise<TemplateEntity[]> = Lazy(async () => {
    let parent = await this.parent
    if (!parent) return []

    const ancestors = []
    while (parent) {
      ancestors.push(parent)
      parent = await parent.parent
    }

    return ancestors
  })

  /**
   *
   * @returns A merged representation of this template's ancestors. See #mergeAncestors for details.
   */
  parentData: () => Promise<TemplateParentData | undefined> = Lazy(async () => {
    const ancestors = await this.getAncestors()
    if (ancestors.length == 0) return undefined
    return this.mergeAncestors(ancestors)
  })

  /**
   *
   * @returns A merged representation of this template and it's ancestors. See #mergeAncestors for details.
   */
  combinedData: () => Promise<TemplateParentData> = Lazy(async () => {
    const ancestors = await this.getAncestors()
    const thisData = toTemplateParentData(this)
    return this.mergeAncestors([thisData, ...ancestors])
  })

  /**
   *
   * @returns A merged representation of the ancestors:
   *   - `credentialTypes` is a union of credential types from all ancestors (earliest to latest)
   *   - `display.claims` is a union of claims from all ancestors (earliest to latest), with the latest taking precedence (by claim name)
   */
  private mergeAncestors(ancestors: TemplateParentData[]): TemplateParentData {
    const credentialTypes = flatten(compact(ancestors.map((a) => a.credentialTypes)).reverse())
    const data = merge({}, ...ancestors.map(toTemplateParentData), {
      credentialTypes: credentialTypes.length ? credentialTypes : undefined,
    })
    const claims = ancestors
      .reduce<TemplateDisplayClaim[]>((acc, { display }) => {
        if (!display?.claims) return acc
        const toAdd = display.claims.filter((claim) => !acc.some((c) => c.claim === claim.claim))
        acc.push(...toAdd.reverse())
        return acc
      }, [])
      .reverse()
    if (claims.length) {
      if (!data.display) data.display = {}
      data.display.claims = claims
    }
    return data
  }

  async update(
    input: Pick<TemplateEntity, 'name' | 'description' | 'isPublic' | 'validityIntervalInSeconds' | 'display' | 'credentialTypes'>,
  ) {
    const parentTemplateData = await this.parentData()
    if (parentTemplateData) {
      ensureNoIntersectingTemplateData(toTemplateParentData(input), parentTemplateData)
    }
    typeSafeAssign(this, input)
  }
}
