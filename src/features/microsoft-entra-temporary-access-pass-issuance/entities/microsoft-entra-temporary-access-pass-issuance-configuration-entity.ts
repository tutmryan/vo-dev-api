import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, UpdateDateColumn } from 'typeorm'
import {
  booleanType,
  dateTimeOffsetTransformer,
  dateTimeOffsetType,
  nvarcharMaxType,
  nvarcharType,
  varcharMaxLength,
} from '../../../data/utils/crossDbColumnTypes'
import { uuidLowerCaseTransformer } from '../../../data/utils/uuidLowerCaseTransformer'
import { VerifiedOrchestrationEntity } from '../../../data/verified-orchestration-entity'
import { typeSafeAssign } from '../../../util/type-safe-assign'
import { IdentityStoreEntity } from '../../identity-store/entities/identity-store-entity'

@Entity('microsoft_entra_temporary_access_pass_issuance_config')
export class MicrosoftEntraTemporaryAccessPassIssuanceConfigurationEntity extends VerifiedOrchestrationEntity {
  constructor(args?: {
    title: string
    description: string | null
    enabled: boolean
    lifetimeMinutes: number | null
    isUsableOnce: boolean | null
  }) {
    super()
    if (args) typeSafeAssign(this, args)
  }

  @CreateDateColumn({ name: 'created_at', type: dateTimeOffsetType, transformer: dateTimeOffsetTransformer })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at', type: dateTimeOffsetType, nullable: true, transformer: dateTimeOffsetTransformer })
  updatedAt!: Date | null

  @Column({ type: nvarcharType, length: 255 })
  title!: string

  @Column({ type: nvarcharMaxType, length: varcharMaxLength, nullable: true })
  description!: string | null

  @Column({ type: booleanType, default: true })
  enabled!: boolean

  @Column({ name: 'lifetime_minutes', type: 'int', nullable: true })
  lifetimeMinutes!: number | null

  @Column({ type: booleanType, nullable: true })
  isUsableOnce!: boolean | null

  @OneToOne(() => IdentityStoreEntity)
  @JoinColumn({ name: 'identity_store_id' })
  identityStore?: Promise<IdentityStoreEntity>

  @Column({ name: 'identity_store_id', nullable: true, transformer: uuidLowerCaseTransformer })
  identityStoreId?: string | null
}
