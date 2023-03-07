import type { ObjectLiteral } from 'typeorm/common/ObjectLiteral'
import type { EntityTarget } from 'typeorm/common/EntityTarget'
import type { Repository } from 'typeorm/repository/Repository'
import type { VerifiedOrchestrationEntity } from './entity'

export type VerifiedOrchestrationEntityManager = {
  getRepository<Entity extends VerifiedOrchestrationEntity>(target: EntityTarget<Entity>): VerifiedOrchestrationRepository<Entity>
}

export type VerifiedOrchestrationRepository<T extends ObjectLiteral> = Omit<Repository<T>, 'create'>
