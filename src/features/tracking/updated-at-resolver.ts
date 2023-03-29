import type { TrackedEntity } from './entities/tracked-entity'

/**
 * returns null for updatedAt when updatedById is not set
 */
export const resolveUpdatedAt = (source: Pick<TrackedEntity, 'updatedById' | 'updatedAt'>): Date | null =>
  source.updatedById ? source.updatedAt : null
