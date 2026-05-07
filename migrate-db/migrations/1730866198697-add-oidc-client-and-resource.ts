import type { MigrationInterface, QueryRunner } from 'typeorm'

export class AddOidcClientAndResource1730866198697 implements MigrationInterface {
  name = 'AddOidcClientAndResource1730866198697'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "oidc_resource" (
                "id" uniqueidentifier NOT NULL,
                "created_at" datetimeoffset NOT NULL CONSTRAINT "DF_70fa42aa0547ca95cd07a3e4223" DEFAULT getdate(),
                "updated_at" datetimeoffset CONSTRAINT "DF_8c8170369a1633b6978bf8a15ea" DEFAULT getdate(),
                "created_by_id" uniqueidentifier NOT NULL,
                "updated_by_id" uniqueidentifier,
                "deleted_at" datetimeoffset,
                "name" nvarchar(255) NOT NULL,
                "resource_indicator" nvarchar(255) NOT NULL,
                "scopes_json" nvarchar(MAX) NOT NULL,
                CONSTRAINT "id_oidc_resource" PRIMARY KEY ("id")
            )
        `)
    await queryRunner.query(`
            CREATE TABLE "oidc_client_resource" (
                "id" uniqueidentifier NOT NULL,
                "created_at" datetimeoffset NOT NULL CONSTRAINT "DF_59fe2421715c20e2a5632d5d8b4" DEFAULT getdate(),
                "updated_at" datetimeoffset CONSTRAINT "DF_d21a2bb013b6add2d35fc093f36" DEFAULT getdate(),
                "created_by_id" uniqueidentifier NOT NULL,
                "updated_by_id" uniqueidentifier,
                "client_id" uniqueidentifier NOT NULL,
                "resource_id" uniqueidentifier NOT NULL,
                "resource_scopes_json" nvarchar(MAX) NOT NULL,
                CONSTRAINT "id_oidc_client_resource" PRIMARY KEY ("id")
            )
        `)
    await queryRunner.query(`
            CREATE UNIQUE INDEX "ix_oidc_client_resource_client_id_resource_id" ON "oidc_client_resource" ("client_id", "resource_id")
        `)
    await queryRunner.query(`
            CREATE TABLE "oidc_client" (
                "id" uniqueidentifier NOT NULL,
                "created_at" datetimeoffset NOT NULL CONSTRAINT "DF_489f08b4ebcd7bc7ac4946d9539" DEFAULT getdate(),
                "updated_at" datetimeoffset CONSTRAINT "DF_d70ca0da9a094f229dbaf299386" DEFAULT getdate(),
                "created_by_id" uniqueidentifier NOT NULL,
                "updated_by_id" uniqueidentifier,
                "deleted_at" datetimeoffset,
                "name" nvarchar(255) NOT NULL,
                "logo" nvarchar(MAX),
                "background_color" nvarchar(255),
                "background_image" nvarchar(MAX),
                "policy_url" nvarchar(MAX),
                "terms_of_service_url" nvarchar(MAX),
                "application_type" nvarchar(255) NOT NULL CONSTRAINT "DF_2fa36ee0ee387c77b6430950d66" DEFAULT 'web',
                "redirect_uris_json" nvarchar(MAX) NOT NULL,
                "post_logout_uris_json" nvarchar(MAX) NOT NULL,
                "allow_any_partner" bit NOT NULL,
                "unique_claims_for_subject_id_json" nvarchar(MAX),
                "credential_types_json" nvarchar(MAX),
                CONSTRAINT "id_oidc_client" PRIMARY KEY ("id")
            )
        `)
    await queryRunner.query(`
            CREATE TABLE "oidc_resource_audit" (
                "id" uniqueidentifier NOT NULL,
                "entity_id" uniqueidentifier NOT NULL,
                "audit_data" nvarchar(MAX) NOT NULL,
                "action" nvarchar(255) NOT NULL,
                "audit_date_time" datetimeoffset NOT NULL,
                "user_id" uniqueidentifier,
                CONSTRAINT "id_oidc_resource_audit" PRIMARY KEY ("id")
            )
        `)
    await queryRunner.query(`
            CREATE TABLE "oidc_client_audit" (
                "id" uniqueidentifier NOT NULL,
                "entity_id" uniqueidentifier NOT NULL,
                "audit_data" nvarchar(MAX) NOT NULL,
                "action" nvarchar(255) NOT NULL,
                "audit_date_time" datetimeoffset NOT NULL,
                "user_id" uniqueidentifier,
                CONSTRAINT "id_oidc_client_audit" PRIMARY KEY ("id")
            )
        `)
    await queryRunner.query(`
            CREATE TABLE "oidc_client_resource_audit" (
                "id" uniqueidentifier NOT NULL,
                "entity_id" uniqueidentifier NOT NULL,
                "audit_data" nvarchar(MAX) NOT NULL,
                "action" nvarchar(255) NOT NULL,
                "audit_date_time" datetimeoffset NOT NULL,
                "user_id" uniqueidentifier,
                CONSTRAINT "id_oidc_client_resource_audit" PRIMARY KEY ("id")
            )
        `)
    await queryRunner.query(`
            CREATE TABLE "oidc_client_partners" (
                "oidc_client_id" uniqueidentifier NOT NULL,
                "partner_id" uniqueidentifier NOT NULL,
                CONSTRAINT "id_oidc_client_partners" PRIMARY KEY ("oidc_client_id", "partner_id")
            )
        `)
    await queryRunner.query(`
            CREATE INDEX "ix_oidc_client_partners_oidc_client_id" ON "oidc_client_partners" ("oidc_client_id")
        `)
    await queryRunner.query(`
            CREATE INDEX "ix_oidc_client_partners_partner_id" ON "oidc_client_partners" ("partner_id")
        `)
    await queryRunner.query(`
            ALTER TABLE "presentation"
            ADD "oidc_client_id" uniqueidentifier
        `)
    await queryRunner.query(`
            ALTER TABLE "oidc_resource"
            ADD CONSTRAINT "fk_oidc_resource_user_created_by_id" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
            ALTER TABLE "oidc_resource"
            ADD CONSTRAINT "fk_oidc_resource_user_updated_by_id" FOREIGN KEY ("updated_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
            ALTER TABLE "oidc_client_resource"
            ADD CONSTRAINT "fk_oidc_client_resource_user_created_by_id" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
            ALTER TABLE "oidc_client_resource"
            ADD CONSTRAINT "fk_oidc_client_resource_user_updated_by_id" FOREIGN KEY ("updated_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
            ALTER TABLE "oidc_client_resource"
            ADD CONSTRAINT "fk_oidc_client_resource_oidc_client_client_id" FOREIGN KEY ("client_id") REFERENCES "oidc_client"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
            ALTER TABLE "oidc_client_resource"
            ADD CONSTRAINT "fk_oidc_client_resource_oidc_resource_resource_id" FOREIGN KEY ("resource_id") REFERENCES "oidc_resource"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
            ALTER TABLE "oidc_client"
            ADD CONSTRAINT "fk_oidc_client_user_created_by_id" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
            ALTER TABLE "oidc_client"
            ADD CONSTRAINT "fk_oidc_client_user_updated_by_id" FOREIGN KEY ("updated_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
            ALTER TABLE "presentation"
            ADD CONSTRAINT "fk_presentation_oidc_client_oidc_client_id" FOREIGN KEY ("oidc_client_id") REFERENCES "oidc_client"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
            ALTER TABLE "oidc_resource_audit"
            ADD CONSTRAINT "fk_oidc_resource_audit_user_user_id" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
            ALTER TABLE "oidc_client_audit"
            ADD CONSTRAINT "fk_oidc_client_audit_user_user_id" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
            ALTER TABLE "oidc_client_resource_audit"
            ADD CONSTRAINT "fk_oidc_client_resource_audit_user_user_id" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
            ALTER TABLE "oidc_client_partners"
            ADD CONSTRAINT "fk_oidc_client_partners_oidc_client_oidc_client_id" FOREIGN KEY ("oidc_client_id") REFERENCES "oidc_client"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `)
    await queryRunner.query(`
            ALTER TABLE "oidc_client_partners"
            ADD CONSTRAINT "fk_oidc_client_partners_partner_partner_id" FOREIGN KEY ("partner_id") REFERENCES "partner"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "oidc_client_partners" DROP CONSTRAINT "fk_oidc_client_partners_partner_partner_id"
        `)
    await queryRunner.query(`
            ALTER TABLE "oidc_client_partners" DROP CONSTRAINT "fk_oidc_client_partners_oidc_client_oidc_client_id"
        `)
    await queryRunner.query(`
            ALTER TABLE "oidc_client_resource_audit" DROP CONSTRAINT "fk_oidc_client_resource_audit_user_user_id"
        `)
    await queryRunner.query(`
            ALTER TABLE "oidc_client_audit" DROP CONSTRAINT "fk_oidc_client_audit_user_user_id"
        `)
    await queryRunner.query(`
            ALTER TABLE "oidc_resource_audit" DROP CONSTRAINT "fk_oidc_resource_audit_user_user_id"
        `)
    await queryRunner.query(`
            ALTER TABLE "presentation" DROP CONSTRAINT "fk_presentation_oidc_client_oidc_client_id"
        `)
    await queryRunner.query(`
            ALTER TABLE "oidc_client" DROP CONSTRAINT "fk_oidc_client_user_updated_by_id"
        `)
    await queryRunner.query(`
            ALTER TABLE "oidc_client" DROP CONSTRAINT "fk_oidc_client_user_created_by_id"
        `)
    await queryRunner.query(`
            ALTER TABLE "oidc_client_resource" DROP CONSTRAINT "fk_oidc_client_resource_oidc_resource_resource_id"
        `)
    await queryRunner.query(`
            ALTER TABLE "oidc_client_resource" DROP CONSTRAINT "fk_oidc_client_resource_oidc_client_client_id"
        `)
    await queryRunner.query(`
            ALTER TABLE "oidc_client_resource" DROP CONSTRAINT "fk_oidc_client_resource_user_updated_by_id"
        `)
    await queryRunner.query(`
            ALTER TABLE "oidc_client_resource" DROP CONSTRAINT "fk_oidc_client_resource_user_created_by_id"
        `)
    await queryRunner.query(`
            ALTER TABLE "oidc_resource" DROP CONSTRAINT "fk_oidc_resource_user_updated_by_id"
        `)
    await queryRunner.query(`
            ALTER TABLE "oidc_resource" DROP CONSTRAINT "fk_oidc_resource_user_created_by_id"
        `)
    await queryRunner.query(`
            ALTER TABLE "presentation" DROP COLUMN "oidc_client_id"
        `)
    await queryRunner.query(`
            DROP INDEX "ix_oidc_client_partners_partner_id" ON "oidc_client_partners"
        `)
    await queryRunner.query(`
            DROP INDEX "ix_oidc_client_partners_oidc_client_id" ON "oidc_client_partners"
        `)
    await queryRunner.query(`
            DROP TABLE "oidc_client_partners"
        `)
    await queryRunner.query(`
            DROP TABLE "oidc_client_resource_audit"
        `)
    await queryRunner.query(`
            DROP TABLE "oidc_client_audit"
        `)
    await queryRunner.query(`
            DROP TABLE "oidc_resource_audit"
        `)
    await queryRunner.query(`
            DROP TABLE "oidc_client"
        `)
    await queryRunner.query(`
            DROP INDEX "ix_oidc_client_resource_client_id_resource_id" ON "oidc_client_resource"
        `)
    await queryRunner.query(`
            DROP TABLE "oidc_client_resource"
        `)
    await queryRunner.query(`
            DROP TABLE "oidc_resource"
        `)
  }
}
