import { Column, Entity, ManyToOne } from 'typeorm'
import { uuidLowerCaseTransformer } from '../../../data/utils/uuid-lower-case-transformer'
import { VerifiedOrchestrationEntity } from '../../../data/verified-orchestration-entity'
import { typeSafeAssign } from '../../../util/type-safe-assign'
import { IdentityStoreEntity } from '../../identity-store/entities/identity-store-entity'

type RequiredArgs = Pick<ApplicationLabelConfigEntity, 'identifier' | 'name' | 'identityStoreId'>
export type CreateOrUpdateArgs = RequiredArgs

@Entity('application_label_config')
export class ApplicationLabelConfigEntity extends VerifiedOrchestrationEntity {
  constructor(args?: CreateOrUpdateArgs) {
    super()
    if (args) typeSafeAssign(this, args)
  }

  @Column({ name: 'identifier', type: 'varchar', unique: true, length: 255 })
  identifier!: string

  @Column({ name: 'name', type: 'nvarchar', length: 255 })
  name!: string

  @ManyToOne(() => IdentityStoreEntity)
  identityStore!: Promise<IdentityStoreEntity>

  @Column({ name: 'identity_store_id', transformer: uuidLowerCaseTransformer })
  identityStoreId!: string

  update(args: CreateOrUpdateArgs) {
    typeSafeAssign(this, args)
  }
}
