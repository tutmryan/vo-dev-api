import { Column, DeleteDateColumn, Entity, OneToOne } from 'typeorm'

import { booleanType, dateTimeOffsetTransformer, dateTimeOffsetType, nvarcharType } from '../../../data/utils/crossDbColumnTypes'
import { IdentityStoreType } from '../../../generated/graphql'
import { typeSafeAssign } from '../../../util/type-safe-assign'
import { AuditedAndTrackedEntity } from '../../auditing/entities/audited-and-tracked-entity'
import { MicrosoftEntraTemporaryAccessPassIssuanceConfigurationEntity } from '../../microsoft-entra-temporary-access-pass-issuance/entities/microsoft-entra-temporary-access-pass-issuance-configuration-entity'

type CreateArgs = Pick<IdentityStoreEntity, 'identifier' | 'name' | 'type' | 'isAuthenticationEnabled'> &
  Partial<Pick<IdentityStoreEntity, 'clientId'>>
type UpdateArgs = Pick<IdentityStoreEntity, 'name' | 'type' | 'isAuthenticationEnabled'> & Partial<{ clientId: string | null }>
@Entity('identity_store')
export class IdentityStoreEntity extends AuditedAndTrackedEntity {
  constructor(args?: CreateArgs) {
    super()
    if (!args) return
    typeSafeAssign(this, args)
  }

  @DeleteDateColumn({ type: dateTimeOffsetType, nullable: true, transformer: dateTimeOffsetTransformer })
  deletedAt!: Date | null

  @Column({ name: 'identifier', type: 'varchar', unique: true, length: 255 })
  identifier!: string

  @Column({ name: 'name', type: nvarcharType, length: 255 })
  name!: string

  @Column({ name: 'type', type: nvarcharType, length: 50 })
  type!: IdentityStoreType

  @Column({ name: 'is_authentication_enabled', type: booleanType })
  isAuthenticationEnabled!: boolean

  @Column({ name: 'client_id', type: 'varchar', length: 255, nullable: true })
  clientId?: string | null

  update(args: UpdateArgs) {
    typeSafeAssign(this, args)
  }

  @OneToOne(() => MicrosoftEntraTemporaryAccessPassIssuanceConfigurationEntity, (config) => config.identityStore)
  microsoftEntraTemporaryAccessPassIssuanceConfiguration?: Promise<MicrosoftEntraTemporaryAccessPassIssuanceConfigurationEntity>
}
