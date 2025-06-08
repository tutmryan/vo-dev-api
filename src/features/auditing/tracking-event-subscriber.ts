import type { EntitySubscriberInterface, InsertEvent, UpdateEvent } from 'typeorm'
import { EventSubscriber } from 'typeorm'
import { getUserFromManager } from '../../data/user-context-helper'
import { AuditedAndTrackedEntity } from './entities/audited-and-tracked-entity'

@EventSubscriber()
export class TrackingEventSubscriber implements EntitySubscriberInterface {
  beforeInsert(event: InsertEvent<unknown>) {
    if (event.entity && event.entity instanceof AuditedAndTrackedEntity) {
      event.entity.createdById = getUserFromManager(event.manager)
    }
  }

  beforeUpdate(event: UpdateEvent<unknown>) {
    if (event.entity && event.entity instanceof AuditedAndTrackedEntity) {
      event.entity.updatedById = getUserFromManager(event.manager)
      event.entity.updatedAt = new Date()
    }
  }
}
