import { Column, CreateDateColumn, Entity, Index, JoinTable, ManyToMany, ManyToOne, RelationId } from 'typeorm'
import { booleanType, dateTimeOffsetTransformer, dateTimeOffsetType, nvarcharType } from '../../../data/utils/crossDbColumnTypes'
import { uuidLowerCaseTransformer } from '../../../data/utils/uuidLowerCaseTransformer'
import { IssuanceStatus } from '../../../generated/graphql'
import { typeSafeAssign } from '../../../util/type-safe-assign'
import { AuditedAndTrackedEntity } from '../../auditing/entities/audited-and-tracked-entity'
import { ContractEntity } from '../../contracts/entities/contract-entity'
import type { CredentialRecordEntity } from '../../credential-record/entities/credential-record-entity'
import { IdentityEntity } from '../../identity/entities/identity-entity'
import { PresentationEntity } from '../../presentation/entities/presentation-entity'
import { UserEntity } from '../../users/entities/user-entity'

@Entity('issuance')
@Index(['contractId', 'issuedAt'])
@Index('ix_issuance_credential_record_id', ['credentialRecordId'], { unique: true })
@Index('ix_issuance_identity_id_is_revoked_expires_at', ['identityId', 'isRevoked', 'expiresAt'])
@Index('ix_issuance_created_by_id', ['issuedById'])
export class IssuanceEntity extends AuditedAndTrackedEntity {
  constructor(
    args?: Pick<
      IssuanceEntity,
      'id' | 'requestId' | 'contractId' | 'identityId' | 'issuedById' | 'expiresAt' | 'hasFaceCheckPhoto' | 'credentialRecordId'
    >,
  ) {
    super()
    if (!args) return
    typeSafeAssign(this, args)
  }

  @Column({ type: nvarcharType, nullable: true })
  requestId!: string | null

  @ManyToOne(() => ContractEntity)
  contract!: Promise<ContractEntity>

  @Column({ transformer: uuidLowerCaseTransformer })
  contractId!: string

  @ManyToOne(() => IdentityEntity)
  identity!: Promise<IdentityEntity>

  @Column({ transformer: uuidLowerCaseTransformer })
  identityId!: string

  @ManyToOne(() => UserEntity)
  issuedBy!: Promise<UserEntity>

  @Column({ transformer: uuidLowerCaseTransformer })
  issuedById!: string

  @CreateDateColumn({ type: dateTimeOffsetType, transformer: dateTimeOffsetTransformer })
  issuedAt!: Date

  @Column({ type: dateTimeOffsetType, transformer: dateTimeOffsetTransformer })
  expiresAt!: Date

  @Column({ type: booleanType, nullable: true })
  isRevoked!: boolean | null

  @ManyToOne(() => UserEntity, { nullable: true })
  revokedBy!: Promise<UserEntity | null>

  @RelationId((issuance: IssuanceEntity) => issuance.revokedBy)
  revokedById!: string | null

  @Column({ type: dateTimeOffsetType, nullable: true, transformer: dateTimeOffsetTransformer })
  revokedAt!: Date | null

  @Column({ type: booleanType, nullable: true })
  hasFaceCheckPhoto!: boolean | null

  @ManyToOne('CredentialRecordEntity')
  credentialRecord!: Promise<CredentialRecordEntity>

  @Column({ transformer: uuidLowerCaseTransformer })
  credentialRecordId!: string

  @ManyToMany(() => PresentationEntity)
  @JoinTable({ name: 'presentation_issuances' })
  presentations!: Promise<PresentationEntity[]>

  @RelationId((issuance: IssuanceEntity) => issuance.presentations)
  presentationIds!: string[]

  markAsRevoked(user: UserEntity) {
    this.isRevoked = true
    this.revokedBy = Promise.resolve(user)
    this.revokedAt = new Date()
  }

  get status(): IssuanceStatus {
    if (this.isRevoked) return IssuanceStatus.Revoked
    if (this.expiresAt.getTime() < Date.now()) return IssuanceStatus.Expired
    return IssuanceStatus.Active
  }
}
