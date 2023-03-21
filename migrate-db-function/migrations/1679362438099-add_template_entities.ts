import { MigrationInterface, QueryRunner } from "typeorm";

export class addTemplateEntities1679362438099 implements MigrationInterface {
    name = 'addTemplateEntities1679362438099'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "template_display_consent" (
                "id" uniqueidentifier NOT NULL,
                "title" nvarchar(255),
                "instructions" nvarchar(255),
                CONSTRAINT "id_template_display_consent" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "template_display_credential_logo" (
                "id" uniqueidentifier NOT NULL,
                "uri" nvarchar(255),
                "image" nvarchar(255),
                "description" nvarchar(255),
                CONSTRAINT "id_template_display_credential_logo" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "template_display_credential" (
                "id" uniqueidentifier NOT NULL,
                "title" nvarchar(255),
                "issued_by" nvarchar(255),
                "background_color" nvarchar(7),
                "text_color" nvarchar(7),
                "description" nvarchar(255),
                "logo_id" uniqueidentifier NOT NULL,
                CONSTRAINT "id_template_display_credential" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "rel_template_display_credential_logo_id" ON "template_display_credential" ("logo_id")
            WHERE "logo_id" IS NOT NULL
        `);
        await queryRunner.query(`
            CREATE TABLE "template_display" (
                "id" uniqueidentifier NOT NULL,
                "locale" nvarchar(255),
                "card_id" uniqueidentifier NOT NULL,
                "consent_id" uniqueidentifier NOT NULL,
                CONSTRAINT "id_template_display" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "rel_template_display_card_id" ON "template_display" ("card_id")
            WHERE "card_id" IS NOT NULL
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "rel_template_display_consent_id" ON "template_display" ("consent_id")
            WHERE "consent_id" IS NOT NULL
        `);
        await queryRunner.query(`
            CREATE TABLE "template_display_claim" (
                "id" uniqueidentifier NOT NULL,
                "label" nvarchar(255) NOT NULL,
                "claim" nvarchar(255) NOT NULL,
                "type" nvarchar(255) NOT NULL,
                "description" nvarchar(255),
                "value" nvarchar(255),
                "display_id" uniqueidentifier NOT NULL,
                CONSTRAINT "id_template_display_claim" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "template" (
                "id" uniqueidentifier NOT NULL,
                "name" nvarchar(255) NOT NULL,
                "description" nvarchar(255) NOT NULL,
                "is_public" bit,
                "validity_interval_in_seconds" int,
                "parent_id" uniqueidentifier,
                "display_id" uniqueidentifier NOT NULL,
                CONSTRAINT "id_template" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "rel_template_display_id" ON "template" ("display_id")
            WHERE "display_id" IS NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "template_display_credential"
            ADD CONSTRAINT "fk_template_display_credential_template_display_credential_logo" FOREIGN KEY ("logo_id") REFERENCES "template_display_credential_logo"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "template_display"
            ADD CONSTRAINT "fk_template_display_template_display_credential_card_id" FOREIGN KEY ("card_id") REFERENCES "template_display_credential"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "template_display"
            ADD CONSTRAINT "fk_template_display_template_display_consent_consent_id" FOREIGN KEY ("consent_id") REFERENCES "template_display_consent"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "template_display_claim"
            ADD CONSTRAINT "fk_template_display_claim_template_display_display_id" FOREIGN KEY ("display_id") REFERENCES "template_display"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "template"
            ADD CONSTRAINT "fk_template_template_parent_id" FOREIGN KEY ("parent_id") REFERENCES "template"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "template"
            ADD CONSTRAINT "fk_template_template_display_display_id" FOREIGN KEY ("display_id") REFERENCES "template_display"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "template" DROP CONSTRAINT "fk_template_template_display_display_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "template" DROP CONSTRAINT "fk_template_template_parent_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "template_display_claim" DROP CONSTRAINT "fk_template_display_claim_template_display_display_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "template_display" DROP CONSTRAINT "fk_template_display_template_display_consent_consent_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "template_display" DROP CONSTRAINT "fk_template_display_template_display_credential_card_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "template_display_credential" DROP CONSTRAINT "fk_template_display_credential_template_display_credential_logo"
        `);
        await queryRunner.query(`
            DROP INDEX "rel_template_display_id" ON "template"
        `);
        await queryRunner.query(`
            DROP TABLE "template"
        `);
        await queryRunner.query(`
            DROP TABLE "template_display_claim"
        `);
        await queryRunner.query(`
            DROP INDEX "rel_template_display_consent_id" ON "template_display"
        `);
        await queryRunner.query(`
            DROP INDEX "rel_template_display_card_id" ON "template_display"
        `);
        await queryRunner.query(`
            DROP TABLE "template_display"
        `);
        await queryRunner.query(`
            DROP INDEX "rel_template_display_credential_logo_id" ON "template_display_credential"
        `);
        await queryRunner.query(`
            DROP TABLE "template_display_credential"
        `);
        await queryRunner.query(`
            DROP TABLE "template_display_credential_logo"
        `);
        await queryRunner.query(`
            DROP TABLE "template_display_consent"
        `);
    }

}
