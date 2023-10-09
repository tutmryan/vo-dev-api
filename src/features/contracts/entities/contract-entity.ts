import { differenceInSeconds } from 'date-fns'
import { isEqual, uniq } from 'lodash'
import { Column, Entity, ManyToOne, RelationId } from 'typeorm'
import type { ContractDisplayCredential, ContractDisplayCredentialLogo, ContractDisplayModel } from '../../../generated/graphql'
import { ContractStatus } from '../../../generated/graphql'
import { domainInvariant } from '../../../util/domain-invariant'
import { typeSafeAssign } from '../../../util/type-safe-assign'
import { AuditedAndTrackedEntity } from '../../auditing/entities/audited-and-tracked-entity'
import { TemplateEntity } from '../../templates/entities/template-entity'
import { UserEntity } from '../../users/entities/user-entity'

// same as ContractDisplayModel but without card.logo.image
export type PersistedContractDisplayModel = Omit<ContractDisplayModel, 'card'> & {
  card: Omit<ContractDisplayCredential, 'logo'> & { logo: Omit<ContractDisplayCredentialLogo, 'image'> }
}

@Entity('contract', { orderBy: { createdAt: 'ASC' } })
export class ContractEntity extends AuditedAndTrackedEntity {
  constructor(
    args?: Pick<ContractEntity, 'id' | 'name' | 'isPublic' | 'validityIntervalInSeconds' | 'credentialTypes' | 'display'> & {
      template: TemplateEntity | null
    },
  ) {
    super()
    if (!args) return
    const { template, ...rest } = args
    typeSafeAssign(this, { ...rest, template: Promise.resolve(template) })
  }

  @Column({ type: 'nvarchar' })
  name!: string

  @ManyToOne(() => TemplateEntity, { nullable: true })
  template!: Promise<TemplateEntity | null>

  @Column({ nullable: true })
  templateId!: string | null

  @Column({ type: 'bit', nullable: false })
  isPublic!: boolean

  @Column({ type: 'int', nullable: false })
  validityIntervalInSeconds!: number

  @Column({ type: 'uniqueidentifier', nullable: true })
  externalId!: string | null

  @ManyToOne(() => UserEntity, { nullable: true })
  provisionedBy!: Promise<UserEntity | null>

  @RelationId((contract: ContractEntity) => contract.provisionedBy)
  provisionedById!: string | null

  @Column({ type: 'datetimeoffset', nullable: true })
  provisionedAt!: Date | null

  @ManyToOne(() => UserEntity, { nullable: true })
  lastProvisionedBy!: Promise<UserEntity | null>

  @RelationId((contract: ContractEntity) => contract.lastProvisionedBy)
  lastProvisionedById!: string | null

  @Column({ type: 'datetimeoffset', nullable: true })
  lastProvisionedAt!: Date | null

  @Column({ type: 'bit', nullable: true })
  isDeprecated!: boolean | null

  @ManyToOne(() => UserEntity, { nullable: true })
  deprecatedBy!: Promise<UserEntity | null>

  @RelationId((contract: ContractEntity) => contract.deprecatedBy)
  deprecatedById!: string | null

  @Column({ type: 'datetimeoffset', nullable: true })
  deprecatedAt!: Date | null

  @Column({ type: 'nvarchar', length: 'MAX' })
  private displayJson!: string

  get display(): PersistedContractDisplayModel {
    return JSON.parse(this.displayJson)
  }

  set display(display: PersistedContractDisplayModel) {
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

  async update(
    input: Pick<ContractEntity, 'name' | 'credentialTypes' | 'isPublic' | 'validityIntervalInSeconds' | 'display' | 'templateId'>,
  ) {
    typeSafeAssign(this, input)
  }

  markAsProvisioned({ externalId, user }: { externalId: string; user: UserEntity }) {
    this.externalId = externalId
    this.provisionedBy = Promise.resolve(user)
    this.provisionedAt = new Date()
  }

  markAsReprovisioned(user: UserEntity) {
    this.lastProvisionedBy = Promise.resolve(user)
    this.lastProvisionedAt = new Date()
  }

  markAsDeprecated(user: UserEntity) {
    this.isDeprecated = true
    this.deprecatedBy = Promise.resolve(user)
    this.deprecatedAt = new Date()
  }

  get status(): ContractStatus {
    const lastSaved = this.updatedAt ?? this.createdAt
    const lastProvisioned = this.lastProvisionedAt ?? this.provisionedAt ?? undefined
    if (this.isDeprecated) return ContractStatus.Deprecated
    if (!lastProvisioned) return ContractStatus.Draft
    if (differenceInSeconds(lastSaved, lastProvisioned) > 2) return ContractStatus.PublishedOutdated
    return ContractStatus.Published
  }
}
