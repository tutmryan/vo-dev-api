import { Column, JoinColumn, ManyToOne, RelationId } from 'typeorm'
import { uuidLowerCaseTransformer } from '../../../data/utils/uuid-lower-case-transformer'
import { AuditAction } from './audit-action'
import { UserEntity } from '../../users/entities/user-entity'
import { VerifiedOrchestrationEntity } from '../../../data/verified-orchestration-entity'

export abstract class AuditBase extends VerifiedOrchestrationEntity {
  @Column({ type: 'uniqueidentifier', transformer: uuidLowerCaseTransformer })
  entityId!: string

  @Column({ type: 'nvarchar', length: 'MAX' })
  auditData!: string

  @Column({ type: 'nvarchar' })
  action!: AuditAction

  @ManyToOne(() => UserEntity)
  @JoinColumn()
  user!: UserEntity

  @RelationId((audit: AuditBase) => audit.user)
  userId!: string

  @Column({ type: 'datetimeoffset' })
  auditDateTime!: Date

  get auditDataObject() {
    return JSON.parse(this.auditData)
  }
}
