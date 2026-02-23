import { Column, Entity, Index, ManyToOne } from 'typeorm'
import { uuidLowerCaseTransformer } from '../../../data/utils/uuid-lower-case-transformer'
import { typeSafeAssign } from '../../../util/type-safe-assign'
import { AuditedAndTrackedEntity } from '../../auditing/entities/audited-and-tracked-entity'
import { IdentityStoreEntity } from '../../identity-store/entities/identity-store-entity'

export const identityColumnsOf = (fields: (keyof IdentityEntity)[]) => fields

type RequiredArgs = Pick<IdentityEntity, 'issuer' | 'identifier' | 'name' | 'identityStoreId'>
type CreateOrUpdateArgs = RequiredArgs
@Entity('identity')
@Index(['issuer', 'identifier'], { unique: true })
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

  @Column({ type: 'nvarchar' })
  issuer!: string

  @Column({ type: 'nvarchar' })
  identifier!: string

  @Column({ type: 'nvarchar' })
  name!: string

  update(args: CreateOrUpdateArgs) {
    typeSafeAssign(this, args)
  }
}
