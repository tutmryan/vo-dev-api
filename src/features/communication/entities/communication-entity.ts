import { Column, CreateDateColumn, Entity, Index, ManyToOne } from 'typeorm'
import { uuidLowerCaseTransformer } from '../../../data/utils/uuid-lower-case-transformer'
import { VerifiedOrchestrationEntity } from '../../../data/verified-orchestration-entity'
import { CommunicationPurpose, ContactMethod, CommunicationStatus } from '../../../generated/graphql'
import { typeSafeAssign } from '../../../util/type-safe-assign'
import { AsyncIssuanceEntity } from '../../async-issuance/entities/async-issuance-entity'
import { IdentityEntity } from '../../identity/entities/identity-entity'
import { UserEntity } from '../../users/entities/user-entity'

const indexFor = (fields: [keyof CommunicationEntity]) => fields

@Entity('communication')
@Index(indexFor(['sentAt']))
export class CommunicationEntity extends VerifiedOrchestrationEntity {
  constructor(
    args?: Pick<CommunicationEntity, 'createdById' | 'recipientId' | 'contactMethod' | 'purpose' | 'status' | 'details'> & {
      asyncIssuanceId?: string
    },
  ) {
    super()
    if (!args) return
    const { asyncIssuanceId, ...rest } = args
    typeSafeAssign(this, { ...rest, asyncIssuanceId: asyncIssuanceId ?? null })
  }

  @CreateDateColumn({ type: 'datetimeoffset' })
  sentAt!: Date

  @ManyToOne(() => UserEntity)
  createdBy!: Promise<UserEntity>

  @Column({ transformer: uuidLowerCaseTransformer })
  createdById!: string

  @ManyToOne(() => IdentityEntity)
  recipient!: Promise<IdentityEntity>

  @Column({ transformer: uuidLowerCaseTransformer })
  recipientId!: string

  @Column({ type: 'nvarchar', length: 255 })
  contactMethod!: ContactMethod

  @Column({ type: 'nvarchar', length: 255 })
  purpose!: CommunicationPurpose

  @ManyToOne(() => AsyncIssuanceEntity)
  asyncIssuance!: Promise<UserEntity | null>

  @Column({ nullable: true, transformer: uuidLowerCaseTransformer })
  asyncIssuanceId!: string | null

  @Column({ type: 'nvarchar', length: 255 })
  status!: CommunicationStatus

  @Column({ type: 'nvarchar', nullable: true })
  details?: string
}
