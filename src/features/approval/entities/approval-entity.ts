import { Column, CreateDateColumn, Entity, ManyToOne, RelationId } from 'typeorm'
import type { PresentationRequestInput } from '../../../generated/graphql'
import { ApprovalStatus } from '../../../generated/graphql'
import { AuditedAndTrackedEntity } from '../../auditing/entities/audited-and-tracked-entity'
import { PresentationEntity } from '../../presentation/entities/presentation-entity'
import { UserEntity } from '../../users/entities/user-entity'

@Entity('approval')
export class ApprovalEntity extends AuditedAndTrackedEntity {
  @CreateDateColumn({ type: 'datetimeoffset' })
  requestedAt!: Date

  @ManyToOne(() => UserEntity)
  requestedBy!: Promise<UserEntity>

  @Column()
  requestedById!: string

  @ManyToOne(() => PresentationEntity)
  presentation!: Promise<PresentationEntity>

  @Column()
  presentationId!: string

  @Column({ type: 'datetimeoffset' })
  expiresAt!: Date

  @Column({ type: 'bit', nullable: true })
  isApproved!: boolean | null

  @Column({ type: 'nvarchar', nullable: true })
  approvalReason!: string | null

  @ManyToOne(() => UserEntity, { nullable: true })
  actionedBy!: Promise<UserEntity | null>

  @RelationId((approval: ApprovalEntity) => approval.actionedBy)
  actionedById!: string | null

  @Column({ type: 'datetimeoffset', nullable: true })
  actionedAt!: Date | null

  @Column({ type: 'nvarchar' })
  type!: string

  @Column({ type: 'nvarchar' })
  requestedForId!: string

  @Column({ type: 'nvarchar', nullable: true })
  requestedReason!: string | null

  @Column({ type: 'nvarchar', nullable: true })
  url!: string | null

  @Column({ type: 'nvarchar', length: 'MAX' })
  requestedForDataJson!: string | null

  get requestedForData(): any | null {
    return this.requestedForDataJson ? JSON.parse(this.requestedForDataJson) : null
  }

  @Column({ type: 'nvarchar', length: 'MAX' })
  presentationRequestInputJson!: string

  get presentationRequestInput(): PresentationRequestInput {
    return JSON.parse(this.presentationRequestInputJson)
  }

  get status(): ApprovalStatus {
    if (this.isApproved) return ApprovalStatus.Approved
    if (this.isApproved === false) return ApprovalStatus.Rejected
    if (this.expiresAt.getTime() < Date.now()) return ApprovalStatus.Expired
    return ApprovalStatus.Active
  }
}
