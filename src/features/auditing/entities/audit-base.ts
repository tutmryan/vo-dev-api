import { Column, JoinColumn, ManyToOne, RelationId } from 'typeorm'
import {
  dateTimeOffsetTransformer,
  dateTimeOffsetType,
  nvarcharMaxType,
  nvarcharType,
  varcharMaxLength,
} from '../../../data/utils/crossDbColumnTypes'
import { uuidLowerCaseTransformer } from '../../../data/utils/uuidLowerCaseTransformer'
import { VerifiedOrchestrationEntity } from '../../../data/verified-orchestration-entity'
import { UserEntity } from '../../users/entities/user-entity'
import { AuditAction } from './audit-action'

export abstract class AuditBase extends VerifiedOrchestrationEntity {
  @Column({ type: 'uuid', transformer: uuidLowerCaseTransformer })
  entityId!: string

  @Column({ type: nvarcharMaxType, length: varcharMaxLength })
  auditData!: string

  @Column({ type: nvarcharType })
  action!: AuditAction

  @ManyToOne(() => UserEntity)
  @JoinColumn()
  user!: UserEntity

  @RelationId((audit: AuditBase) => audit.user)
  userId!: string

  @Column({ type: dateTimeOffsetType, transformer: dateTimeOffsetTransformer })
  auditDateTime!: Date

  get auditDataObject() {
    return JSON.parse(this.auditData)
  }
}
