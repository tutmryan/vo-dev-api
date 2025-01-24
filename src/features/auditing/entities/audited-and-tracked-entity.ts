import { Column, CreateDateColumn, ManyToOne, UpdateDateColumn } from 'typeorm'
import { uuidLowerCaseTransformer } from '../../../data/utils/uuid-lower-case-transformer'
import { VerifiedOrchestrationEntity } from '../../../data/verified-orchestration-entity'
import type { UserEntity } from '../../users/entities/user-entity'

export abstract class AuditedAndTrackedEntity extends VerifiedOrchestrationEntity {
  @CreateDateColumn({ type: 'datetimeoffset' })
  createdAt!: Date

  @UpdateDateColumn({ type: 'datetimeoffset', nullable: true })
  updatedAt!: Date | null

  @ManyToOne('UserEntity')
  createdBy!: Promise<UserEntity>

  @Column({ type: 'uniqueidentifier', transformer: uuidLowerCaseTransformer })
  createdById!: string

  @ManyToOne('UserEntity', { nullable: true })
  updatedBy!: Promise<UserEntity | null>

  @Column({ type: 'uniqueidentifier', nullable: true, transformer: uuidLowerCaseTransformer })
  updatedById!: string | null
}
