import type { EntityTarget } from 'typeorm/common/EntityTarget'
import type { ObjectLiteral } from 'typeorm/common/ObjectLiteral'
import type { Repository } from 'typeorm/repository/Repository'
import type { VerifiedOrchestrationEntity } from './verified-orchestration-entity'

export type VerifiedOrchestrationEntityManager = {
  getRepository<Entity extends VerifiedOrchestrationEntity>(target: EntityTarget<Entity>): VerifiedOrchestrationRepository<Entity>
}

export type VerifiedOrchestrationRepository<T extends ObjectLiteral> = Omit<Repository<T>, 'create'>
