import { Column, Entity, ManyToOne } from 'typeorm'
import type { Callback, PresentationRequestInput } from '../../../generated/graphql'
import { ApprovalRequestStatus } from '../../../generated/graphql'
import { invariant } from '../../../util/invariant'
import { typeSafeAssign } from '../../../util/type-safe-assign'
import { AuditedAndTrackedEntity } from '../../auditing/entities/audited-and-tracked-entity'
import { PresentationEntity } from '../../presentation/entities/presentation-entity'

@Entity('approval_request')
export class ApprovalRequestEntity extends AuditedAndTrackedEntity {
  constructor(
    args?: Pick<
      ApprovalRequestEntity,
      | 'expiresAt'
      | 'requestType'
      | 'correlationId'
      | 'referenceUrl'
      | 'purpose'
      | 'requestDataJson'
      | 'callbackJson'
      | 'presentationRequestJson'
    >,
  ) {
    super()
    if (args) typeSafeAssign(this, args)
  }

  @Column({ type: 'datetimeoffset' })
  expiresAt!: Date

  @Column({ type: 'nvarchar' })
  requestType!: string

  @Column({ type: 'nvarchar', nullable: true })
  correlationId!: string | null

  @Column({ type: 'nvarchar', nullable: true })
  referenceUrl!: string | null

  @Column({ type: 'nvarchar', nullable: true })
  purpose!: string | null

  @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
  requestDataJson!: string | null

  get requestData(): any | null {
    return this.requestDataJson ? JSON.parse(this.requestDataJson) : null
  }

  @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
  callbackJson!: string | null

  get callback(): any | null {
    return this.callbackJson ? JSON.parse(this.callbackJson) : null
  }

  get callbackInput(): Callback | null {
    return this.callbackJson ? JSON.parse(this.callbackJson) : null
  }

  @Column({ type: 'nvarchar', length: 'MAX' })
  presentationRequestJson!: string

  get presentationRequest(): any {
    return JSON.parse(this.presentationRequestJson)
  }

  get presentationRequestInput(): PresentationRequestInput {
    return JSON.parse(this.presentationRequestJson)
  }

  @ManyToOne(() => PresentationEntity)
  presentation!: Promise<PresentationEntity>

  @Column({ type: 'uniqueidentifier', nullable: true })
  presentationId!: string

  @Column({ type: 'bit', nullable: true })
  isApproved!: boolean | null

  @Column({ type: 'nvarchar', nullable: true })
  actionedComment!: string | null

  get status(): ApprovalRequestStatus {
    if (this.isApproved) return ApprovalRequestStatus.Approved
    if (this.isApproved === false) return ApprovalRequestStatus.Rejected
    if (this.expiresAt.getTime() < Date.now()) return ApprovalRequestStatus.Expired
    return ApprovalRequestStatus.Pending
  }

  action(isApproved: boolean, actionedComment: any) {
    invariant(this.status === ApprovalRequestStatus.Pending, `Cannot action an approval request that is ${this.status}`)
    this.isApproved = isApproved
    this.actionedComment = actionedComment
  }
}
