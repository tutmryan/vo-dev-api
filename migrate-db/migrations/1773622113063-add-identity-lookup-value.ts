import type { MigrationInterface, QueryRunner } from 'typeorm'

export class AddIdentityLookupValue1773622113063 implements MigrationInterface {
  name = 'AddIdentityLookupValue1773622113063'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "identity"
      ADD "lookup_value" nvarchar(255) NULL
    `)

    await queryRunner.query(`
      CREATE UNIQUE INDEX "ix_identity_lookup_value" ON "identity" ("identity_store_id", "lookup_value") WHERE lookup_value IS NOT NULL
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "ix_identity_lookup_value" ON "identity"
    `)

    await queryRunner.query(`
      ALTER TABLE "identity" DROP COLUMN "lookup_value"
    `)
  }
}
