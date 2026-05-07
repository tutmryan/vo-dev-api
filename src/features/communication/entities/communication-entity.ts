import { Column, CreateDateColumn, Entity, Index, ManyToOne } from 'typeorm'
import { dateTimeOffsetTransformer, dateTimeOffsetType, nvarcharType } from '../../../data/utils/crossDbColumnTypes'
import { uuidLowerCaseTransformer } from '../../../data/utils/uuidLowerCaseTransformer'
import { VerifiedOrchestrationEntity } from '../../../data/verified-orchestration-entity'
import { CommunicationPurpose, CommunicationStatus, ContactMethod } from '../../../generated/graphql'
import { typeSafeAssign } from '../../../util/type-safe-assign'
import { AsyncIssuanceEntity } from '../../async-issuance/entities/async-issuance-entity'
import { IdentityEntity } from '../../identity/entities/identity-entity'
import { PresentationFlowEntity } from '../../presentation-flow/entities/presentation-flow-entity'
import { UserEntity } from '../../users/entities/user-entity'

const indexFor = (fields: [keyof CommunicationEntity]) => fields

@Entity('communication')
@Index(indexFor(['sentAt']))
@Index('ix_communication_async_issuance_id_purpose', ['asyncIssuanceId', 'purpose'])
export class CommunicationEntity extends VerifiedOrchestrationEntity {
  constructor(
    args?: Pick<CommunicationEntity, 'createdById' | 'recipientId' | 'contactMethod' | 'purpose' | 'status' | 'details'> & {
      asyncIssuanceId?: string
      presentationFlowId?: string
    },
  ) {
    super()
    if (!args) return
    const { asyncIssuanceId, presentationFlowId, ...rest } = args
    typeSafeAssign(this, { ...rest, asyncIssuanceId: asyncIssuanceId ?? null, presentationFlowId: presentationFlowId ?? null })
  }

  @CreateDateColumn({ type: dateTimeOffsetType, transformer: dateTimeOffsetTransformer })
  sentAt!: Date

  @ManyToOne(() => UserEntity)
  createdBy!: Promise<UserEntity>

  @Column({ transformer: uuidLowerCaseTransformer })
  createdById!: string

  @ManyToOne(() => IdentityEntity)
  recipient!: Promise<IdentityEntity>

  @Column({ transformer: uuidLowerCaseTransformer })
  recipientId!: string

  @Column({ type: nvarcharType, length: 255 })
  contactMethod!: ContactMethod

  @Column({ type: nvarcharType, length: 255 })
  purpose!: CommunicationPurpose

  @ManyToOne(() => AsyncIssuanceEntity)
  asyncIssuance!: Promise<UserEntity | null>

  @Column({ nullable: true, transformer: uuidLowerCaseTransformer })
  asyncIssuanceId!: string | null

  @ManyToOne(() => PresentationFlowEntity)
  presentationFlow!: Promise<PresentationFlowEntity | null>

  @Column({ nullable: true, transformer: uuidLowerCaseTransformer })
  presentationFlowId!: string | null

  @Column({ type: nvarcharType, length: 255 })
  status!: CommunicationStatus

  @Column({ type: nvarcharType, nullable: true })
  details?: string
}
