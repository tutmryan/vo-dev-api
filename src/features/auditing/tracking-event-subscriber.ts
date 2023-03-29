import type { EntitySubscriberInterface, InsertEvent, UpdateEvent } from 'typeorm'
import { EventSubscriber } from 'typeorm'
import { TrackedEntity } from './entities/tracked-entity'
import { getUserFromManager } from './user-context-helper'

@EventSubscriber()
export class TrackingEventSubscriber implements EntitySubscriberInterface {
  beforeInsert(event: InsertEvent<unknown>) {
    if (event.entity && event.entity instanceof TrackedEntity) {
      event.entity.createdById = getUserFromManager(event.manager)
    }
  }

  beforeUpdate(event: UpdateEvent<unknown>) {
    if (event.entity && event.entity instanceof TrackedEntity) {
      event.entity.updatedById = getUserFromManager(event.manager)
    }
  }
}
