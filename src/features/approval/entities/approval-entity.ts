import { Column, CreateDateColumn, Entity, ManyToOne, RelationId } from 'typeorm'
import type { RequestedApproval } from '../../../generated/graphql'
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

  @ManyToOne(() => UserEntity, { nullable: true })
  actionedBy!: Promise<UserEntity | null>

  @RelationId((approval: ApprovalEntity) => approval.actionedBy)
  actionedById!: string | null

  @Column({ type: 'datetimeoffset', nullable: true })
  actionedAt!: Date | null

  @Column({ type: 'nvarchar', length: 'MAX' })
  requestedApprovalJson!: string

  get requestedApproval(): RequestedApproval {
    return JSON.parse(this.requestedApprovalJson)
  }

  get status(): ApprovalStatus {
    if (this.isApproved) return ApprovalStatus.Approved
    if (this.isApproved === false) return ApprovalStatus.Rejected
    if (this.expiresAt.getTime() < Date.now()) return ApprovalStatus.Expired
    return ApprovalStatus.Active
  }
}
