import type { MigrationInterface, QueryRunner } from 'typeorm'

export class AddMicrosoftEntraTemporaryAccessPassIssuanceConfig1769584891455 implements MigrationInterface {
  name = 'AddMicrosoftEntraTemporaryAccessPassIssuanceConfig1769584891455'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "microsoft_entra_temporary_access_pass_issuance_config" (
                "id" uniqueidentifier NOT NULL,
                "created_at" datetimeoffset NOT NULL CONSTRAINT "DF_a7ea298e6af5a09272a570a3d30" DEFAULT getdate(),
                "updated_at" datetimeoffset CONSTRAINT "DF_8e878b210e0e40a2041fe9e506d" DEFAULT getdate(),
                "title" nvarchar(255) NOT NULL,
                "description" nvarchar(MAX),
                "enabled" bit NOT NULL CONSTRAINT "DF_tap_issuance_config_enabled" DEFAULT 1,
                "lifetime_minutes" int,
                "is_usable_once" bit,
                "identity_store_id" uniqueidentifier,
                CONSTRAINT "pk_microsoft_entra_temporary_access_pass_issuance_config" PRIMARY KEY ("id")
            )
        `)
    await queryRunner.query(`
            CREATE INDEX "ix_microsoft_entra_temporary_access_pass_issuance_config_identity_store_id" ON "microsoft_entra_temporary_access_pass_issuance_config" ("identity_store_id")
        `)
    await queryRunner.query(`
            ALTER TABLE "microsoft_entra_temporary_access_pass_issuance_config"
            ADD CONSTRAINT "fk_microsoft_entra_temporary_access_pass_issuance_config_identity_store_id" FOREIGN KEY ("identity_store_id") REFERENCES "identity_store"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "microsoft_entra_temporary_access_pass_issuance_config" DROP CONSTRAINT "fk_microsoft_entra_temporary_access_pass_issuance_config_identity_store_id"`,
    )
    await queryRunner.query(
      `DROP INDEX "ix_microsoft_entra_temporary_access_pass_issuance_config_identity_store_id" ON "microsoft_entra_temporary_access_pass_issuance_config"`,
    )
    await queryRunner.query(`DROP TABLE "microsoft_entra_temporary_access_pass_issuance_config"`)
  }
}
