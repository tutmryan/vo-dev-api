import { Column, Entity, Index, ManyToOne, OneToMany } from 'typeorm'
import { calculateExpiryFromNow, convertAsyncIssuanceExpiryDaysToRequestExpiry, ExpiryPeriodsInDays } from '..'
import { AsyncIssuanceRequestExpiry, AsyncIssuanceRequestStatus } from '../../../generated/graphql'
import { logger } from '../../../logger'
import { typeSafeAssign } from '../../../util/type-safe-assign'
import { AuditedAndTrackedEntity } from '../../auditing/entities/audited-and-tracked-entity'
import { CommunicationEntity } from '../../communication/entities/communication-entity'
import { ContractEntity } from '../../contracts/entities/contract-entity'
import { IdentityEntity } from '../../identity/entities/identity-entity'
import { IssuanceEntity } from '../../issuance/entities/issuance-entity'

type EndsWithFailed<T extends string> = T extends `${string}-failed` ? T : never

export type FailedStates = EndsWithFailed<AsyncIssuanceEntity['state']>

export const failedStates: FailedStates[] = ['contact-failed', 'issuance-failed', 'issuance-verification-failed'] as const

const indexFor = (fields: [keyof AsyncIssuanceEntity]) => fields

@Entity('async_issuance')
@Index(indexFor(['expiresOn']))
@Index(indexFor(['state']))
export class AsyncIssuanceEntity extends AuditedAndTrackedEntity {
  constructor(args?: Pick<AsyncIssuanceEntity, 'id' | 'contractId' | 'identityId' | 'expiryPeriodInDays'>) {
    super()
    if (!args) return
    typeSafeAssign(this, {
      expiresOn: calculateExpiryFromNow(args.expiryPeriodInDays),
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
  state!: 'pending' | 'contacted' | 'contact-failed' | 'issued' | 'issuance-verification-failed' | 'issuance-failed' | 'cancelled'

  @OneToMany(() => CommunicationEntity, (communication) => communication.asyncIssuance)
  communications!: Promise<CommunicationEntity[]>

  get status(): AsyncIssuanceRequestStatus {
    if (this.state === 'issued') return AsyncIssuanceRequestStatus.Issued
    if (this.state === 'cancelled') return AsyncIssuanceRequestStatus.Cancelled
    if (this.isExpired) return AsyncIssuanceRequestStatus.Expired
    if (failedStates.includes(this.state as FailedStates)) return AsyncIssuanceRequestStatus.Failed
    return AsyncIssuanceRequestStatus.Pending
  }

  get expiry(): AsyncIssuanceRequestExpiry {
    return convertAsyncIssuanceExpiryDaysToRequestExpiry(this.expiryPeriodInDays)
  }

  get isExpired() {
    return this.expiresOn < new Date()
  }

  get failureReason() {
    if (this.state === 'contact-failed') return 'Failed to contact the issuee'
    if (this.state === 'issuance-verification-failed') return 'Failed to verify the issuee'
    if (this.state === 'issuance-failed') return 'Failed to issue the credential'
    if (failedStates.includes(this.state as FailedStates)) {
      logger.warn(`Unhandled failed state ${this.state}`)
      return 'Failed to issue the credential'
    }
    return null
  }

  public get isStatusFinal() {
    return [AsyncIssuanceRequestStatus.Expired, AsyncIssuanceRequestStatus.Cancelled, AsyncIssuanceRequestStatus.Issued].includes(
      this.status,
    )
  }

  public get canCancel() {
    return ![AsyncIssuanceRequestStatus.Cancelled, AsyncIssuanceRequestStatus.Issued].includes(this.status)
  }

  public failed(reason: FailedStates) {
    this.state = reason
  }

  public issued(issuance: IssuanceEntity) {
    this.state = 'issued'
    this.issuanceId = issuance.id
  }

  public canceled() {
    this.state = 'cancelled'
  }

  public contacted() {
    this.state = 'contacted'
  }
}
