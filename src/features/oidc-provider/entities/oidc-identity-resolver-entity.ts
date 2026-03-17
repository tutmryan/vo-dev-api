import { Column, DeleteDateColumn, Entity, ManyToOne } from 'typeorm'
import { dateTimeOffsetTransformer, dateTimeOffsetType, nvarcharType, varcharMaxLength } from '../../../data/utils/crossDbColumnTypes'
import { uuidLowerCaseTransformer } from '../../../data/utils/uuidLowerCaseTransformer'
import { IdentityStoreType, OidcIdentityLookupType } from '../../../generated/graphql'
import { typeSafeAssign } from '../../../util/type-safe-assign'
import { AuditedAndTrackedEntity } from '../../auditing/entities/audited-and-tracked-entity'
import { IdentityStoreEntity } from '../../identity-store/entities/identity-store-entity'

export type CreateOrUpdateArgs = Pick<
  OidcIdentityResolverEntity,
  'name' | 'credentialTypes' | 'claimName' | 'identityStoreType' | 'identityStoreId' | 'lookupType'
>

@Entity('oidc_identity_resolver')
export class OidcIdentityResolverEntity extends AuditedAndTrackedEntity {
  constructor(args?: CreateOrUpdateArgs) {
    super()
    if (args) typeSafeAssign(this, args)
  }

  @DeleteDateColumn({ type: dateTimeOffsetType, transformer: dateTimeOffsetTransformer, nullable: true })
  deletedAt!: Date | null

  @Column({ type: nvarcharType })
  name!: string

  @Column({ type: nvarcharType, length: varcharMaxLength, nullable: true })
  private credentialTypesJson!: string | null

  get credentialTypes(): string[] | null {
    return this.credentialTypesJson ? JSON.parse(this.credentialTypesJson) : null
  }
  set credentialTypes(value: string[] | null) {
    this.credentialTypesJson = value ? JSON.stringify(value) : null
  }

  @Column({ type: nvarcharType, length: 255, name: 'claim_name' })
  claimName!: string

  @Column({ type: nvarcharType, length: 50, name: 'identity_store_type' })
  identityStoreType!: IdentityStoreType

  @ManyToOne(() => IdentityStoreEntity)
  identityStore!: Promise<IdentityStoreEntity>

  @Column({ type: 'uuid', name: 'identity_store_id', transformer: uuidLowerCaseTransformer })
  identityStoreId!: string

  @Column({ type: nvarcharType, length: 50, name: 'lookup_type' })
  lookupType!: OidcIdentityLookupType

  update(args: CreateOrUpdateArgs) {
    typeSafeAssign(this, args)
  }
}
