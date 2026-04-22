import type { MigrationInterface, QueryRunner } from 'typeorm'

export class AddAccessPackagesEnabledToIdentityStore1776830379350 implements MigrationInterface {
  name = 'AddAccessPackagesEnabledToIdentityStore1776830379350'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "identity_store"
            ADD "access_packages_enabled" bit NOT NULL CONSTRAINT "DF_identity_store_access_packages_enabled" DEFAULT 0
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "identity_store"
            DROP CONSTRAINT "DF_identity_store_access_packages_enabled"
        `)
    await queryRunner.query(`
            ALTER TABLE "identity_store"
            DROP COLUMN "access_packages_enabled"
        `)
  }
}
