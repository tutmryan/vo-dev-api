import { compact, flatten, isEqual, merge, uniq } from 'lodash'
import { Column, Entity, ManyToOne, OneToMany, RelationId } from 'typeorm'
import { booleanType, nvarcharMaxLength, nvarcharMaxType, nvarcharType } from '../../../data/utils/crossDbColumnTypes'
import type {
  FaceCheckPhotoSupport,
  Maybe,
  TemplateDisplayClaim,
  TemplateDisplayCredential,
  TemplateDisplayCredentialLogo,
  TemplateDisplayModel,
  TemplateParentData,
} from '../../../generated/graphql'
import { domainInvariant } from '../../../util/domain-invariant'
import { Lazy } from '../../../util/lazy'
import { typeSafeAssign } from '../../../util/type-safe-assign'
import { AuditedAndTrackedEntity } from '../../auditing/entities/audited-and-tracked-entity'
import { ContractEntity } from '../../contracts/entities/contract-entity'
import { toTemplateParentData } from '../mapping'

// same as TemplateDisplayModel but without card.logo.image
type PersistedTemplateDisplayModel = Maybe<Omit<TemplateDisplayModel, 'card'>> & {
  card?: Maybe<Omit<TemplateDisplayCredential, 'logo'>> & { logo?: Maybe<Omit<TemplateDisplayCredentialLogo, 'image'>> }
}

@Entity('template', { orderBy: { createdAt: 'ASC' } })
export class TemplateEntity extends AuditedAndTrackedEntity {
  constructor(
    args?: Pick<
      TemplateEntity,
      'id' | 'name' | 'isPublic' | 'validityIntervalInSeconds' | 'credentialTypes' | 'display' | 'faceCheckSupport'
    > & {
      parent: TemplateEntity | null
    },
  ) {
    super()
    if (!args) return
    const { parent, ...rest } = args
    typeSafeAssign(this, { ...rest, parent: Promise.resolve(parent) })
  }

  @Column({ type: nvarcharType })
  name!: string

  @ManyToOne(() => TemplateEntity, { nullable: true })
  parent!: Promise<TemplateEntity | null>

  @RelationId((template: TemplateEntity) => template.parent)
  parentId!: string | null

  @OneToMany(() => TemplateEntity, (template) => template.parent)
  children!: Promise<TemplateEntity[]>

  @OneToMany(() => ContractEntity, (contract) => contract.template)
  contracts!: Promise<ContractEntity[]>

  @Column({ type: booleanType, nullable: true })
  isPublic!: boolean | null

  @Column({ type: 'int', nullable: true })
  validityIntervalInSeconds!: number | null

  @Column({ type: nvarcharMaxType, length: nvarcharMaxLength, nullable: true })
  private displayJson?: string | null

  get display(): PersistedTemplateDisplayModel | null {
    return this.displayJson ? JSON.parse(this.displayJson) : null
  }
  set display(display: PersistedTemplateDisplayModel | null) {
    this.displayJson = display ? JSON.stringify(display) : null
  }

  @Column({ type: nvarcharMaxType, length: nvarcharMaxLength, nullable: true })
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

  @Column({ type: nvarcharType, nullable: true })
  faceCheckSupport!: FaceCheckPhotoSupport | null

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
    input: Pick<TemplateEntity, 'name' | 'isPublic' | 'validityIntervalInSeconds' | 'display' | 'credentialTypes' | 'faceCheckSupport'> & {
      parent: TemplateEntity | null
    },
  ) {
    const { parent, ...rest } = input
    typeSafeAssign(this, { ...rest, parent: Promise.resolve(parent) })
  }
}
