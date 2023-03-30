import { Column, JoinColumn, ManyToOne } from 'typeorm'
import { AuditAction } from './audit-action'
import { UserEntity } from '../../users/entities/user-entity'
import { VerifiedOrchestrationEntity } from '../../../data/verified-orchestration-entity'

export abstract class AuditBase extends VerifiedOrchestrationEntity {
  @Column({ type: 'uniqueidentifier' })
  entityId!: string

  @Column({ type: 'nvarchar', length: 'MAX' })
  auditData!: object

  @Column({ type: 'nvarchar' })
  action!: AuditAction

  @ManyToOne(() => UserEntity)
  @JoinColumn()
  user!: UserEntity

  @Column({ type: 'datetimeoffset' })
  auditDateTime!: Date
}
