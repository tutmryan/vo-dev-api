import { Column, JoinColumn, ManyToOne, RelationId } from 'typeorm'
import { uuidLowerCaseTransformer } from '../../../data/utils/uuidLowerCaseTransformer'
import { VerifiedOrchestrationEntity } from '../../../data/verified-orchestration-entity'
import { UserEntity } from '../../users/entities/user-entity'
import { AuditAction } from './audit-action'

export abstract class AuditBase extends VerifiedOrchestrationEntity {
  @Column({ type: 'uuid', transformer: uuidLowerCaseTransformer })
  entityId!: string

  @Column({ type: 'text' })
  auditData!: string

  @Column({ type: 'varchar' })
  action!: AuditAction

  @ManyToOne(() => UserEntity)
  @JoinColumn()
  user!: UserEntity

  @RelationId((audit: AuditBase) => audit.user)
  userId!: string

  @Column({ type: 'datetime' })
  auditDateTime!: Date

  get auditDataObject() {
    return JSON.parse(this.auditData)
  }
}
