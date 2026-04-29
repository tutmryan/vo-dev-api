import type { MigrationInterface, QueryRunner } from 'typeorm'

export class MdocPresentationFlow1776774385732 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add type column with default 'vc' for existing rows, then drop the default constraint
    // so the column has no DB-level default (consistent with the entity definition)
    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID(N'presentation_flow') AND name = 'type'
      )
      BEGIN
        ALTER TABLE "presentation_flow"
        ADD "type" nvarchar(20) NOT NULL DEFAULT 'vc'
      END
    `)

    // Drop the DEFAULT constraint so the schema matches the TypeORM entity (no default defined)
    await queryRunner.query(`
      DECLARE @constraintName NVARCHAR(256)
      SELECT @constraintName = dc.name
      FROM sys.default_constraints dc
      INNER JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
      WHERE dc.parent_object_id = OBJECT_ID(N'presentation_flow') AND c.name = 'type'

      IF @constraintName IS NOT NULL
      BEGIN
        EXEC('ALTER TABLE "presentation_flow" DROP CONSTRAINT "' + @constraintName + '"')
      END
    `)

    // Make presentation_request_json nullable
    await queryRunner.query(`
      IF EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID(N'presentation_flow') AND name = 'presentation_request_json'
          AND is_nullable = 0
      )
      BEGIN
        ALTER TABLE "presentation_flow"
        ALTER COLUMN "presentation_request_json" nvarchar(MAX) NULL
      END
    `)

    // Add mdoc_request_json column (nullable)
    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID(N'presentation_flow') AND name = 'mdoc_request_json'
      )
      BEGIN
        ALTER TABLE "presentation_flow"
        ADD "mdoc_request_json" nvarchar(MAX) NULL
      END
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      IF EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID(N'presentation_flow') AND name = 'mdoc_request_json'
      )
      BEGIN
        ALTER TABLE "presentation_flow" DROP COLUMN "mdoc_request_json"
      END
    `)

    // Revert presentation_request_json back to NOT NULL
    await queryRunner.query(`
      IF EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID(N'presentation_flow') AND name = 'presentation_request_json'
          AND is_nullable = 1
      )
      BEGIN
        ALTER TABLE "presentation_flow"
        ALTER COLUMN "presentation_request_json" nvarchar(MAX) NOT NULL
      END
    `)

    await queryRunner.query(`
      IF EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID(N'presentation_flow') AND name = 'type'
      )
      BEGIN
        ALTER TABLE "presentation_flow" DROP COLUMN "type"
      END
    `)
  }
}
