import type { MigrationInterface, QueryRunner } from 'typeorm'

const systemUserId = 'FAA690AC-D8D0-4FF8-AA38-2A9C53084CA9'
const legacySystemUserOid = systemUserId

export class AddKnownSystemUser1749795075331 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const legacySystemUserResult = await queryRunner.sql<[{ id: string }]>`SELECT id FROM dbo.[user] WHERE oid = ${legacySystemUserOid}`
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const legacySystemUserId = legacySystemUserResult[0]?.id

    // Ensure the OID can be used, so clear it from the existing system user if it exists
    await queryRunner.sql`
      UPDATE dbo.[user]
      SET oid = '00000000-0000-0000-0000-000000000000'
      WHERE id = ${legacySystemUserId}`

    // Ideally, we would use the home tenant ID here, but it isn't available in the migration context.
    // For the system user, this is not significant, so using an empty tenant ID matches the approach in the management API database.
    await queryRunner.sql`
        INSERT INTO dbo.[user] (id, oid, tenant_id, email, name, is_app)
        VALUES (${systemUserId}, ${systemUserId}, '00000000-0000-0000-0000-000000000000', NULL, 'System', 1)`

    if (legacySystemUserId) {
      // Before removing the old system user, ensure that the new system user ID is used in all tables

      // Add temporary index to async_issuance_audit.user_id
      await queryRunner.sql`
        CREATE INDEX idx_async_issuance_audit_user_id ON dbo.[async_issuance_audit] (user_id)`

      // Update all tables with a created_by_id column
      const targetTables = await queryRunner.sql<
        [{ tableName: string }]
      >`SELECT TABLE_NAME as tableName FROM INFORMATION_SCHEMA.COLUMNS WHERE COLUMN_NAME = 'created_by_id'`
      for (const { tableName } of targetTables) {
        await queryRunner.query(
          `
          UPDATE dbo.[${tableName}]
          SET created_by_id = @0
          WHERE created_by_id = @1`,
          [systemUserId, legacySystemUserId],
        )
      }
      // Update all tables with an updated_by_id column
      const updateTables = await queryRunner.sql<
        [{ tableName: string }]
      >`SELECT TABLE_NAME as tableName FROM INFORMATION_SCHEMA.COLUMNS WHERE COLUMN_NAME = 'updated_by_id'`
      for (const { tableName } of updateTables) {
        await queryRunner.query(
          `
          UPDATE dbo.[${tableName}]
          SET updated_by_id = @0
          WHERE updated_by_id = @1`,
          [systemUserId, legacySystemUserId],
        )
      }
      // Update all tables with a user_id column
      const userTables = await queryRunner.sql<
        [{ tableName: string }]
      >`SELECT TABLE_NAME as tableName FROM INFORMATION_SCHEMA.COLUMNS WHERE COLUMN_NAME = 'user_id'`
      for (const { tableName } of userTables) {
        await queryRunner.query(
          `
          UPDATE dbo.[${tableName}]
          SET user_id = @0
          WHERE user_id = @1`,
          [systemUserId, legacySystemUserId],
        )
      }

      // Finally, remove the old system user
      await queryRunner.sql`
        DELETE FROM dbo.[user]
        WHERE id = ${legacySystemUserId}`

      // Remove the temporary index
      await queryRunner.sql`
        DROP INDEX idx_async_issuance_audit_user_id ON dbo.[async_issuance_audit]`
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
