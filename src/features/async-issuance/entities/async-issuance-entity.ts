import { addDays } from 'date-fns'
import { Column, Entity, Index, ManyToOne, OneToMany } from 'typeorm'
import { convertAsyncIssuanceExpiryDaysToRequestExpiry, ExpiryPeriodsInDays } from '..'
import { AsyncIssuanceRequestExpiry, AsyncIssuanceRequestStatus } from '../../../generated/graphql'
import { typeSafeAssign } from '../../../util/type-safe-assign'
import { AuditedAndTrackedEntity } from '../../auditing/entities/audited-and-tracked-entity'
import { CommunicationEntity } from '../../communication/entities/communication-entity'
import { ContractEntity } from '../../contracts/entities/contract-entity'
import { IdentityEntity } from '../../identity/entities/identity-entity'
import { IssuanceEntity } from '../../issuance/entities/issuance-entity'

const indexFor = (fields: [keyof AsyncIssuanceEntity]) => fields

@Entity('async_issuance')
@Index(indexFor(['expiresOn']))
@Index(indexFor(['state']))
export class AsyncIssuanceEntity extends AuditedAndTrackedEntity {
  constructor(args?: Pick<AsyncIssuanceEntity, 'id' | 'contractId' | 'identityId' | 'expiryPeriodInDays'>) {
    super()
    if (!args) return
    typeSafeAssign(this, {
      expiresOn: addDays(new Date(), args.expiryPeriodInDays),
      ...args,
      state: 'pending',
    })
  }

  @Column({ type: 'datetimeoffset' })
  expiresOn!: Date

  @Column({ type: 'smallint' })
  expiryPeriodInDays!: ExpiryPeriodsInDays

  @ManyToOne(() => ContractEntity)
  contract!: Promise<ContractEntity>

  @Column()
  contractId!: string

  @ManyToOne(() => IdentityEntity)
  identity!: Promise<IdentityEntity>

  @Column()
  identityId!: string

  @ManyToOne(() => IssuanceEntity)
  issuance!: Promise<IssuanceEntity | null>

  @Column({ nullable: true })
  issuanceId!: string | null

  @Column({ type: 'nvarchar', default: 'pending' })
  state!: 'pending' | 'contacted' | 'issued' | 'failed' | 'cancelled'

  @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
  failureReason!: string | null

  @OneToMany(() => CommunicationEntity, (communication) => communication.asyncIssuance)
  communications!: Promise<CommunicationEntity[]>

  get status(): AsyncIssuanceRequestStatus {
    if (this.state === 'issued') return AsyncIssuanceRequestStatus.Issued
    if (this.state === 'cancelled') return AsyncIssuanceRequestStatus.Cancelled
    if (this.expiresOn < new Date()) return AsyncIssuanceRequestStatus.Expired
    if (this.state === 'failed') return AsyncIssuanceRequestStatus.Failed
    return AsyncIssuanceRequestStatus.Pending
  }

  get expiry(): AsyncIssuanceRequestExpiry {
    return convertAsyncIssuanceExpiryDaysToRequestExpiry(this.expiryPeriodInDays)
  }

  public failed(failureReason: string) {
    this.state = 'failed'
    this.failureReason = failureReason
  }

  public issued(issuance: IssuanceEntity) {
    this.state = 'issued'
    this.issuanceId = issuance.id
    this.failureReason = null
  }

  public canceled() {
    this.state = 'cancelled'
    this.failureReason = null
  }

  public contacted() {
    this.state = 'contacted'
    this.failureReason = null
  }
}
