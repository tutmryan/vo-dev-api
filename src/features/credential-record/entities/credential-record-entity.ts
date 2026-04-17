import { Column, CreateDateColumn, Entity, Index, ManyToOne } from 'typeorm'
import { dateTimeOffsetTransformer, dateTimeOffsetType } from '../../../data/utils/crossDbColumnTypes'
import { uuidLowerCaseTransformer } from '../../../data/utils/uuidLowerCaseTransformer'
import { VerifiedOrchestrationEntity } from '../../../data/verified-orchestration-entity'
import { ContractEntity } from '../../contracts/entities/contract-entity'
import { IdentityEntity } from '../../identity/entities/identity-entity'
import type { UserEntity } from '../../users/entities/user-entity'

@Entity('credential_record')
@Index('ix_credential_record_contract_id', ['contractId'])
@Index('ix_credential_record_identity_id', ['identityId'])
@Index('ix_credential_record_created_at', ['createdAt'])
export class CredentialRecordEntity extends VerifiedOrchestrationEntity {
  @CreateDateColumn({ type: dateTimeOffsetType, transformer: dateTimeOffsetTransformer })
  createdAt!: Date

  @Column({ type: 'uuid', transformer: uuidLowerCaseTransformer })
  createdById!: string

  @ManyToOne('UserEntity')
  createdBy!: Promise<UserEntity>

  @ManyToOne(() => ContractEntity)
  contract!: Promise<ContractEntity>

  @Column({ type: 'uuid', transformer: uuidLowerCaseTransformer })
  contractId!: string

  @ManyToOne(() => IdentityEntity)
  identity!: Promise<IdentityEntity>

  @Column({ type: 'uuid', transformer: uuidLowerCaseTransformer })
  identityId!: string

  @Column({ type: dateTimeOffsetType, transformer: dateTimeOffsetTransformer, nullable: true })
  expiresAt!: Date | null

  @Column({ type: dateTimeOffsetType, transformer: dateTimeOffsetTransformer, nullable: true })
  failedAt!: Date | null

  @Column({ type: dateTimeOffsetType, transformer: dateTimeOffsetTransformer, nullable: true })
  cancelledAt!: Date | null
}
