import type { MigrationInterface, QueryRunner } from 'typeorm'

export class AddPresentationFlowNotifications1774569600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add notification_status to presentation_flow
    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID(N'presentation_flow') AND name = 'notification_status'
      )
      BEGIN
        ALTER TABLE "presentation_flow"
        ADD "notification_status" nvarchar(255)
      END
    `)

    // Add has_contact_notification to presentation_flow
    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID(N'presentation_flow') AND name = 'has_contact_notification'
      )
      BEGIN
        ALTER TABLE "presentation_flow"
        ADD "has_contact_notification" bit NULL
      END
    `)

    // Add notification_json to presentation_flow_template
    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID(N'presentation_flow_template') AND name = 'notification_json'
      )
      BEGIN
        ALTER TABLE "presentation_flow_template"
        ADD "notification_json" nvarchar(MAX)
      END
    `)

    // Add presentation_flow_id to communication
    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID(N'communication') AND name = 'presentation_flow_id'
      )
      BEGIN
        ALTER TABLE "communication"
        ADD "presentation_flow_id" uniqueidentifier
      END
    `)

    // Add FK constraint from communication to presentation_flow
    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.foreign_keys
        WHERE name = 'fk_communication_presentation_flow_presentation_flow_id'
      )
      BEGIN
        ALTER TABLE "communication"
        ADD CONSTRAINT "fk_communication_presentation_flow_presentation_flow_id"
        FOREIGN KEY ("presentation_flow_id") REFERENCES "presentation_flow"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      END
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      IF EXISTS (
        SELECT 1 FROM sys.foreign_keys
        WHERE name = 'fk_communication_presentation_flow_presentation_flow_id'
      )
      BEGIN
        ALTER TABLE "communication"
        DROP CONSTRAINT "fk_communication_presentation_flow_presentation_flow_id"
      END
    `)

    await queryRunner.query(`
      IF EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID(N'communication') AND name = 'presentation_flow_id'
      )
      BEGIN
        ALTER TABLE "communication" DROP COLUMN "presentation_flow_id"
      END
    `)

    await queryRunner.query(`
      IF EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID(N'presentation_flow_template') AND name = 'notification_json'
      )
      BEGIN
        ALTER TABLE "presentation_flow_template" DROP COLUMN "notification_json"
      END
    `)

    await queryRunner.query(`
      IF EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID(N'presentation_flow') AND name = 'has_contact_notification'
      )
      BEGIN
        ALTER TABLE "presentation_flow" DROP COLUMN "has_contact_notification"
      END
    `)

    await queryRunner.query(`
      IF EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID(N'presentation_flow') AND name = 'notification_status'
      )
      BEGIN
        ALTER TABLE "presentation_flow" DROP COLUMN "notification_status"
      END
    `)
  }
}
