import { Column, CreateDateColumn, ManyToOne, UpdateDateColumn } from 'typeorm'
import { dateTimeOffsetTransformer, dateTimeOffsetType } from '../../../data/utils/crossDbColumnTypes'
import { uuidLowerCaseTransformer } from '../../../data/utils/uuidLowerCaseTransformer'
import { VerifiedOrchestrationEntity } from '../../../data/verified-orchestration-entity'
import type { UserEntity } from '../../users/entities/user-entity'

export abstract class AuditedAndTrackedEntity extends VerifiedOrchestrationEntity {
  @CreateDateColumn({ type: dateTimeOffsetType, transformer: dateTimeOffsetTransformer })
  createdAt!: Date

  @UpdateDateColumn({ type: dateTimeOffsetType, nullable: true, transformer: dateTimeOffsetTransformer })
  updatedAt!: Date | null

  @ManyToOne('UserEntity')
  createdBy!: Promise<UserEntity>

  @Column({ type: 'uuid', transformer: uuidLowerCaseTransformer })
  createdById!: string

  @ManyToOne('UserEntity', { nullable: true })
  updatedBy!: Promise<UserEntity | null>

  @Column({ type: 'uuid', nullable: true, transformer: uuidLowerCaseTransformer })
  updatedById!: string | null
}
