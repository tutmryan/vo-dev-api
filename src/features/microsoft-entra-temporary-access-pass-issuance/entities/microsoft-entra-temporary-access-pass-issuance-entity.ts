import { Column, Entity, Index, ManyToOne } from 'typeorm'
import { dateTimeOffsetTransformer, dateTimeOffsetType } from '../../../data/utils/crossDbColumnTypes'
import { uuidLowerCaseTransformer } from '../../../data/utils/uuidLowerCaseTransformer'
import { VerifiedOrchestrationEntity } from '../../../data/verified-orchestration-entity'
import { IdentityStoreEntity } from '../../identity-store/entities/identity-store-entity'
import { IdentityEntity } from '../../identity/entities/identity-entity'

@Entity('microsoft_entra_temporary_access_pass_issuance')
@Index('ix_microsoft_entra_temporary_access_pass_issuance_identity_store_id', ['identityStoreId'])
@Index('ix_microsoft_entra_temporary_access_pass_issuance_identity_id', ['identityId'])
@Index('ix_microsoft_entra_temporary_access_pass_issuance_issued_at', ['issuedAt'])
@Index('ix_microsoft_entra_temporary_access_pass_issuance_expiration_time', ['expirationTime'])
export class MicrosoftEntraTemporaryAccessPassIssuanceEntity extends VerifiedOrchestrationEntity {
  @ManyToOne(() => IdentityStoreEntity)
  identityStore!: Promise<IdentityStoreEntity>

  @Column({ name: 'identity_store_id', transformer: uuidLowerCaseTransformer })
  identityStoreId!: string

  @Column({ name: 'issued_at', type: dateTimeOffsetType, nullable: true, transformer: dateTimeOffsetTransformer })
  issuedAt?: Date | null

  @Column({ name: 'expiration_time', type: dateTimeOffsetType, nullable: true, transformer: dateTimeOffsetTransformer })
  expirationTime?: Date | null

  @ManyToOne(() => IdentityEntity)
  identity!: Promise<IdentityEntity>

  @Column({ name: 'identity_id', type: 'uuid', transformer: uuidLowerCaseTransformer })
  identityId!: string

  @Column({ name: 'external_id' })
  externalId!: string

  @Column({ name: 'created_date_time', type: dateTimeOffsetType, nullable: true, transformer: dateTimeOffsetTransformer })
  createdDateTime?: Date | null

  @Column({ name: 'start_date_time', type: dateTimeOffsetType, nullable: true, transformer: dateTimeOffsetTransformer })
  startDateTime?: Date | null

  @Column({ name: 'is_usable_once', nullable: true })
  isUsableOnce?: boolean
}
