import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOidcClaimMapping1749456287027 implements MigrationInterface {
    name = 'AddOidcClaimMapping1749456287027'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "oidc_claim_mapping" (
                "id" uniqueidentifier NOT NULL,
                "created_at" datetimeoffset NOT NULL CONSTRAINT "DF_0297e20b49b331c1a07c99edcf0" DEFAULT getdate(),
                "updated_at" datetimeoffset CONSTRAINT "DF_53bd374dd2c3091e8cc474cf9cf" DEFAULT getdate(),
                "created_by_id" uniqueidentifier NOT NULL,
                "updated_by_id" uniqueidentifier,
                "deleted_at" datetimeoffset,
                "name" nvarchar(255) NOT NULL,
                "mapping_json" nvarchar(MAX) NOT NULL,
                "credential_types_json" nvarchar(MAX),
                CONSTRAINT "id_oidc_claim_mapping" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "oidc_claim_mapping_audit" (
                "id" uniqueidentifier NOT NULL,
                "entity_id" uniqueidentifier NOT NULL,
                "audit_data" nvarchar(MAX) NOT NULL,
                "action" nvarchar(255) NOT NULL,
                "audit_date_time" datetimeoffset NOT NULL,
                "user_id" uniqueidentifier,
                CONSTRAINT "id_oidc_claim_mapping_audit" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "oidc_client_claim_mappings" (
                "oidc_client_id" uniqueidentifier NOT NULL,
                "oidc_claim_mapping_id" uniqueidentifier NOT NULL,
                CONSTRAINT "id_oidc_client_claim_mappings" PRIMARY KEY ("oidc_client_id", "oidc_claim_mapping_id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "ix_oidc_client_claim_mappings_oidc_client_id" ON "oidc_client_claim_mappings" ("oidc_client_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "ix_oidc_client_claim_mappings_oidc_claim_mapping_id" ON "oidc_client_claim_mappings" ("oidc_claim_mapping_id")
        `);
        await queryRunner.query(`
            ALTER TABLE "oidc_claim_mapping"
            ADD CONSTRAINT "fk_oidc_claim_mapping_user_created_by_id" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "oidc_claim_mapping"
            ADD CONSTRAINT "fk_oidc_claim_mapping_user_updated_by_id" FOREIGN KEY ("updated_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "oidc_claim_mapping_audit"
            ADD CONSTRAINT "fk_oidc_claim_mapping_audit_user_user_id" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "oidc_client_claim_mappings"
            ADD CONSTRAINT "fk_oidc_client_claim_mappings_oidc_client_oidc_client_id" FOREIGN KEY ("oidc_client_id") REFERENCES "oidc_client"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `);
        await queryRunner.query(`
            ALTER TABLE "oidc_client_claim_mappings"
            ADD CONSTRAINT "fk_oidc_client_claim_mappings_oidc_claim_mapping_oidc_claim_map" FOREIGN KEY ("oidc_claim_mapping_id") REFERENCES "oidc_claim_mapping"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "oidc_client_claim_mappings" DROP CONSTRAINT "fk_oidc_client_claim_mappings_oidc_claim_mapping_oidc_claim_map"
        `);
        await queryRunner.query(`
            ALTER TABLE "oidc_client_claim_mappings" DROP CONSTRAINT "fk_oidc_client_claim_mappings_oidc_client_oidc_client_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "oidc_claim_mapping_audit" DROP CONSTRAINT "fk_oidc_claim_mapping_audit_user_user_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "oidc_claim_mapping" DROP CONSTRAINT "fk_oidc_claim_mapping_user_updated_by_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "oidc_claim_mapping" DROP CONSTRAINT "fk_oidc_claim_mapping_user_created_by_id"
        `);
        await queryRunner.query(`
            DROP INDEX "ix_oidc_client_claim_mappings_oidc_claim_mapping_id" ON "oidc_client_claim_mappings"
        `);
        await queryRunner.query(`
            DROP INDEX "ix_oidc_client_claim_mappings_oidc_client_id" ON "oidc_client_claim_mappings"
        `);
        await queryRunner.query(`
            DROP TABLE "oidc_client_claim_mappings"
        `);
        await queryRunner.query(`
            DROP TABLE "oidc_claim_mapping_audit"
        `);
        await queryRunner.query(`
            DROP TABLE "oidc_claim_mapping"
        `);
    }

}
