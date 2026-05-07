import type { MigrationInterface, QueryRunner } from 'typeorm'

export class AddMicrosoftEntraTemporaryAccessPassIssuance1770814991341 implements MigrationInterface {
  name = 'AddMicrosoftEntraTemporaryAccessPassIssuance1770814991341'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "microsoft_entra_temporary_access_pass_issuance_config" DROP CONSTRAINT "fk_microsoft_entra_temporary_access_pass_issuance_config_identity_store_id"
        `)
    await queryRunner.query(`
            DROP INDEX "ix_microsoft_entra_temporary_access_pass_issuance_config_identity_store_id" ON "microsoft_entra_temporary_access_pass_issuance_config"
        `)
    await queryRunner.query(`
            CREATE TABLE "microsoft_entra_temporary_access_pass_issuance" (
                "id" uniqueidentifier NOT NULL,
                "identity_store_id" uniqueidentifier NOT NULL,
                "identity_id" uniqueidentifier NOT NULL,
                "external_id" nvarchar(255) NOT NULL,
                "issued_at" datetimeoffset,
                "expiration_time" datetimeoffset,
                "created_date_time" datetimeoffset,
                "start_date_time" datetimeoffset,
                "is_usable_once" bit,
                CONSTRAINT "pk_microsoft_entra_temporary_access_pass_issuance" PRIMARY KEY ("id")
            )
        `)
    // Indexes to support the common filter patterns and sort columns
    await queryRunner.query(`
            CREATE INDEX "ix_microsoft_entra_temporary_access_pass_issuance_identity_store_id" ON "microsoft_entra_temporary_access_pass_issuance" ("identity_store_id")
        `)
    await queryRunner.query(`
            CREATE INDEX "ix_microsoft_entra_temporary_access_pass_issuance_identity_id" ON "microsoft_entra_temporary_access_pass_issuance" ("identity_id")
        `)
    await queryRunner.query(`
            CREATE INDEX "ix_microsoft_entra_temporary_access_pass_issuance_issued_at" ON "microsoft_entra_temporary_access_pass_issuance" ("issued_at")
        `)
    await queryRunner.query(`
            CREATE INDEX "ix_microsoft_entra_temporary_access_pass_issuance_expiration_time" ON "microsoft_entra_temporary_access_pass_issuance" ("expiration_time")
        `)
    await queryRunner.query(`
            CREATE UNIQUE INDEX "rel_microsoft_entra_temporary_access_pass_issuance_config_ident" ON "microsoft_entra_temporary_access_pass_issuance_config" ("identity_store_id")
            WHERE "identity_store_id" IS NOT NULL
        `)
    await queryRunner.query(`
            ALTER TABLE "microsoft_entra_temporary_access_pass_issuance_config"
            ADD CONSTRAINT "fk_microsoft_entra_temporary_access_pass_issuance_config_identi" FOREIGN KEY ("identity_store_id") REFERENCES "identity_store"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
            ALTER TABLE "microsoft_entra_temporary_access_pass_issuance"
            ADD CONSTRAINT "fk_microsoft_entra_temporary_access_pass_issuance_identity_stor" FOREIGN KEY ("identity_store_id") REFERENCES "identity_store"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
            ALTER TABLE "microsoft_entra_temporary_access_pass_issuance"
            ADD CONSTRAINT "fk_microsoft_entra_temporary_access_pass_issuance_identity_iden" FOREIGN KEY ("identity_id") REFERENCES "identity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "microsoft_entra_temporary_access_pass_issuance" DROP CONSTRAINT "fk_microsoft_entra_temporary_access_pass_issuance_identity_iden"
        `)
    await queryRunner.query(`
            ALTER TABLE "microsoft_entra_temporary_access_pass_issuance" DROP CONSTRAINT "fk_microsoft_entra_temporary_access_pass_issuance_identity_stor"
        `)
    await queryRunner.query(`
            ALTER TABLE "microsoft_entra_temporary_access_pass_issuance_config" DROP CONSTRAINT "fk_microsoft_entra_temporary_access_pass_issuance_config_identi"
        `)
    await queryRunner.query(`
            DROP INDEX "rel_microsoft_entra_temporary_access_pass_issuance_config_ident" ON "microsoft_entra_temporary_access_pass_issuance_config"
        `)
    await queryRunner.query(`
            DROP INDEX "ix_microsoft_entra_temporary_access_pass_issuance_expiration_time" ON "microsoft_entra_temporary_access_pass_issuance"
        `)
    await queryRunner.query(`
            DROP INDEX "ix_microsoft_entra_temporary_access_pass_issuance_issued_at" ON "microsoft_entra_temporary_access_pass_issuance"
        `)
    await queryRunner.query(`
            DROP INDEX "ix_microsoft_entra_temporary_access_pass_issuance_identity_id" ON "microsoft_entra_temporary_access_pass_issuance"
        `)
    await queryRunner.query(`
            DROP INDEX "ix_microsoft_entra_temporary_access_pass_issuance_identity_store_id" ON "microsoft_entra_temporary_access_pass_issuance"
        `)
    await queryRunner.query(`
            DROP TABLE "microsoft_entra_temporary_access_pass_issuance"
        `)
    await queryRunner.query(`
            CREATE INDEX "ix_microsoft_entra_temporary_access_pass_issuance_config_identity_store_id" ON "microsoft_entra_temporary_access_pass_issuance_config" ("identity_store_id")
        `)
    await queryRunner.query(`
            ALTER TABLE "microsoft_entra_temporary_access_pass_issuance_config"
            ADD CONSTRAINT "fk_microsoft_entra_temporary_access_pass_issuance_config_identity_store_id" FOREIGN KEY ("identity_store_id") REFERENCES "identity_store"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
  }
}
