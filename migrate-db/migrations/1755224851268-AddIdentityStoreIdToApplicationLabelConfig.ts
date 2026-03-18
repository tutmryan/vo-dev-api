import type { MigrationInterface, QueryRunner } from 'typeorm'

export class AddIdentityStoreIdToApplicationLabelConfig1755224851268 implements MigrationInterface {
  name = 'AddIdentityStoreIdToApplicationLabelConfig1755224851268'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "application_label_config"
            ADD "identity_store_id" uniqueidentifier NOT NULL
        `)
    await queryRunner.query(`
            ALTER TABLE "cors_origin_config" DROP CONSTRAINT "uq_cors_origin_config_origin"
        `)
    await queryRunner.query(`
            ALTER TABLE "cors_origin_config" DROP COLUMN "origin"
        `)
    await queryRunner.query(`
            ALTER TABLE "cors_origin_config"
            ADD "origin" varchar(510) NOT NULL
        `)
    await queryRunner.query(`
            ALTER TABLE "cors_origin_config"
            ADD CONSTRAINT "uq_cors_origin_config_origin" UNIQUE ("origin")
        `)
    await queryRunner.query(`
            ALTER TABLE "application_label_config"
            ADD CONSTRAINT "fk_application_label_config_identity_store_identity_store_id" FOREIGN KEY ("identity_store_id") REFERENCES "identity_store"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "application_label_config" DROP CONSTRAINT "fk_application_label_config_identity_store_identity_store_id"
        `)
    await queryRunner.query(`
            ALTER TABLE "cors_origin_config" DROP CONSTRAINT "uq_cors_origin_config_origin"
        `)
    await queryRunner.query(`
            ALTER TABLE "cors_origin_config" DROP COLUMN "origin"
        `)
    await queryRunner.query(`
            ALTER TABLE "cors_origin_config"
            ADD "origin" varchar(255) NOT NULL
        `)
    await queryRunner.query(`
            ALTER TABLE "cors_origin_config"
            ADD CONSTRAINT "uq_cors_origin_config_origin" UNIQUE ("origin")
        `)
    await queryRunner.query(`
            ALTER TABLE "application_label_config" DROP COLUMN "identity_store_id"
        `)
  }
}
