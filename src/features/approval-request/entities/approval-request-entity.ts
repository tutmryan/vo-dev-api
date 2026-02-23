import { pick } from 'lodash'
import { Column, Entity, ManyToOne } from 'typeorm'
import {
  booleanType,
  dateTimeOffsetTransformer,
  dateTimeOffsetType,
  nvarcharMaxLength,
  nvarcharMaxType,
  nvarcharType,
} from '../../../data/utils/crossDbColumnTypes'
import { uuidLowerCaseTransformer } from '../../../data/utils/uuidLowerCaseTransformer'
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
      | 'callbackSecret'
      | 'presentationRequestJson'
    >,
  ) {
    super()
    if (args) typeSafeAssign(this, args)
  }

  @Column({ type: dateTimeOffsetType, transformer: dateTimeOffsetTransformer })
  expiresAt!: Date

  @Column({ type: nvarcharType })
  requestType!: string

  @Column({ type: nvarcharType, nullable: true })
  correlationId!: string | null

  @Column({ type: nvarcharType, nullable: true })
  referenceUrl!: string | null

  @Column({ type: nvarcharMaxType, length: nvarcharMaxLength, nullable: true })
  purpose!: string | null

  @Column({ type: nvarcharMaxType, length: nvarcharMaxLength, nullable: true })
  requestDataJson!: string | null

  get requestData(): any | null {
    return this.requestDataJson ? JSON.parse(this.requestDataJson) : null
  }

  @Column({ type: nvarcharMaxType, length: nvarcharMaxLength, nullable: true })
  callbackJson!: string | null

  get callback(): any | null {
    return this.callbackJson ? JSON.parse(this.callbackJson) : null
  }

  get callbackInput(): Callback | null {
    return this.callbackJson ? JSON.parse(this.callbackJson) : null
  }

  @Column({ type: 'uuid', transformer: uuidLowerCaseTransformer })
  callbackSecret!: string

  @Column({ type: nvarcharMaxType, length: nvarcharMaxLength })
  presentationRequestJson!: string

  get presentationRequest(): any {
    return JSON.parse(this.presentationRequestJson)
  }

  get presentationRequestInput(): PresentationRequestInput {
    return JSON.parse(this.presentationRequestJson)
  }

  @ManyToOne(() => PresentationEntity)
  presentation!: Promise<PresentationEntity | null>

  @Column({ type: 'uuid', nullable: true, transformer: uuidLowerCaseTransformer })
  presentationId!: string | null

  @Column({ type: booleanType, nullable: true })
  isApproved!: boolean | null

  @Column({ type: booleanType, nullable: true })
  isCancelled!: boolean | null

  @Column({ type: nvarcharType, nullable: true })
  actionedComment!: string | null

  get status(): ApprovalRequestStatus {
    if (this.isApproved) return ApprovalRequestStatus.Approved
    if (this.isApproved === false) return ApprovalRequestStatus.Rejected
    if (this.isCancelled) return ApprovalRequestStatus.Cancelled
    if (this.expiresAt.getTime() < Date.now()) return ApprovalRequestStatus.Expired
    return ApprovalRequestStatus.Pending
  }

  /**
   * Actions the approval request and returns the updated fields
   * @returns A partial object containing just the updated fields
   */
  action(presentationId: string, isApproved: boolean, actionedComment?: string | null) {
    invariant(this.status === ApprovalRequestStatus.Pending, `Cannot action an approval request that is ${this.status}`)

    this.presentationId = presentationId
    this.isApproved = isApproved
    this.actionedComment = actionedComment ?? null

    return pick(this, ['presentationId', 'isApproved', 'actionedComment'])
  }
}
