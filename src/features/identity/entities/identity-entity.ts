import { Column, Entity, Index, ManyToOne } from 'typeorm'
import { nvarcharType } from '../../../data/utils/crossDbColumnTypes'
import { uuidLowerCaseTransformer } from '../../../data/utils/uuidLowerCaseTransformer'
import { typeSafeAssign } from '../../../util/type-safe-assign'
import { AuditedAndTrackedEntity } from '../../auditing/entities/audited-and-tracked-entity'
import { IdentityStoreEntity } from '../../identity-store/entities/identity-store-entity'

export const identityColumnsOf = (fields: (keyof IdentityEntity)[]) => fields

type RequiredArgs = Pick<IdentityEntity, 'issuer' | 'identifier' | 'name' | 'identityStoreId'>
type CreateOrUpdateArgs = RequiredArgs
@Entity('identity')
@Index(['issuer', 'identifier'], { unique: true })
@Index('ix_identity_lookup_value', ['identityStoreId', 'lookupValue'], {
  unique: true,
  where: 'lookup_value IS NOT NULL',
})
export class IdentityEntity extends AuditedAndTrackedEntity {
  constructor(args?: CreateOrUpdateArgs) {
    super()
    if (!args) return
    typeSafeAssign(this, args)
  }

  @ManyToOne(() => IdentityStoreEntity)
  identityStore!: Promise<IdentityStoreEntity>

  @Column({ name: 'identity_store_id', transformer: uuidLowerCaseTransformer })
  identityStoreId!: string

  @Column({ type: nvarcharType })
  issuer!: string

  @Column({ type: nvarcharType })
  identifier!: string

  @Column({ type: nvarcharType })
  name!: string

  @Column({ name: 'lookup_value', type: nvarcharType, nullable: true, length: 255 })
  lookupValue!: string | null

  update(args: CreateOrUpdateArgs) {
    typeSafeAssign(this, args)
  }
}
