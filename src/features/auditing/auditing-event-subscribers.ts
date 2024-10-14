import type { EntitySubscriberInterface, InsertEvent, QueryRunner, RemoveEvent, UpdateEvent } from 'typeorm'
import { EventSubscriber } from 'typeorm'
import type { AuditAction } from './entities/audit-action'
import { getUserFromManager } from './user-context-helper'
import { randomUUID } from 'crypto'
import { getReplacer } from '../../util/replacers'
import { AuditedAndTrackedEntity } from './entities/audited-and-tracked-entity'

export type AuditData = { entityId: string; userId: string; action: AuditAction; auditDateTime: Date; auditData: string }

export type AuditOptimisationControl = {
  handoffInsert: (auditData: AuditData) => void
}

@EventSubscriber()
export class AuditingEventSubscriber implements EntitySubscriberInterface {
  private async createAuditRecord(
    queryRunner: QueryRunner,
    userId: string,
    tableName: string,
    entityId: string,
    action: AuditAction,
    data: object | undefined | AuditOptimisationControl,
  ) {
    if (data && 'handoffInsert' in data) {
      const { handoffInsert, ...rawData } = data
      handoffInsert({ entityId, userId, action, auditDateTime: new Date(), auditData: JSON.stringify(rawData, getReplacer()) })
      return
    }

    await queryRunner.query(
      `
      insert into ${tableName}_audit (id, entity_id, user_id, action, audit_date_time, audit_data)
      values(@0, @1, @2, @3, @4, @5)
    `,
      [randomUUID(), entityId, userId, action, new Date(), JSON.stringify(data, getReplacer())],
    )
  }

  async afterInsert(event: InsertEvent<unknown>) {
    // When insert record into join tables, event.entity is null
    if (event.entity && event.entity instanceof AuditedAndTrackedEntity) {
      const userId = getUserFromManager(event.manager)
      await this.createAuditRecord(event.queryRunner, userId, event.metadata.tableName, event.entity.id, 'created', event.entity)
    }
  }

  async afterUpdate(event: UpdateEvent<unknown>) {
    if (event.entity && event.entity instanceof AuditedAndTrackedEntity) {
      const userId = getUserFromManager(event.manager)
      await this.createAuditRecord(
        event.queryRunner,
        userId,
        event.metadata.tableName,
        (event.databaseEntity as AuditedAndTrackedEntity).id,
        'updated',
        event.entity,
      )
    }
  }
  async afterRemove(event: RemoveEvent<unknown>) {
    if (event.entity && event.entity instanceof AuditedAndTrackedEntity) {
      const userId = getUserFromManager(event.manager)
      await this.createAuditRecord(event.queryRunner, userId, event.metadata.tableName, event.entityId, 'deleted', event.entity)
    }
  }
}
