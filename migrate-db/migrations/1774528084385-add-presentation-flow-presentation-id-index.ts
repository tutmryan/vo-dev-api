import type { MigrationInterface, QueryRunner } from 'typeorm'

export class AddPresentationIndexes1774528084385 implements MigrationInterface {
  name = 'AddPresentationIndexes1774528084385'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_presentation_flow_presentation_id' AND object_id = OBJECT_ID('presentation_flow'))
        CREATE INDEX "ix_presentation_flow_presentation_id" ON "presentation_flow" ("presentation_id")
    `)
    await queryRunner.query(`
      IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_presentation_wallet_id' AND object_id = OBJECT_ID('presentation'))
        CREATE NONCLUSTERED INDEX "ix_presentation_wallet_id" ON "presentation" ("wallet_id")
        INCLUDE ("identity_id", "oidc_client_id", "presented_at", "requested_by_id", "request_id")
        WITH (ONLINE = ON)
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_presentation_wallet_id' AND object_id = OBJECT_ID('presentation'))
        DROP INDEX "ix_presentation_wallet_id" ON "presentation"
    `)
    await queryRunner.query(`
      IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_presentation_flow_presentation_id' AND object_id = OBJECT_ID('presentation_flow'))
        DROP INDEX "ix_presentation_flow_presentation_id" ON "presentation_flow"
    `)
  }
}
