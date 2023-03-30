import type { AuditedAndTrackedEntity } from './entities/audited-and-tracked-entity'

/**
 * returns null for updatedAt when updatedById is not set
 */
export const resolveUpdatedAt = (source: Pick<AuditedAndTrackedEntity, 'updatedById' | 'updatedAt'>): Date | null =>
  source.updatedById ? source.updatedAt : null
