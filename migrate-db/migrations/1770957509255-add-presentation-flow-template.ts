import type { MigrationInterface, QueryRunner } from 'typeorm'

export class AddPresentationFlowTemplate1770957509255 implements MigrationInterface {
  name = 'AddPresentationFlowTemplate1770957509255'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "presentation_flow_template" (
        "id" uniqueidentifier NOT NULL,
        "created_at" datetimeoffset NOT NULL CONSTRAINT "DF_presentation_flow_template_created_at" DEFAULT getdate(),
        "updated_at" datetimeoffset CONSTRAINT "DF_presentation_flow_template_updated_at" DEFAULT getdate(),
        "created_by_id" uniqueidentifier NOT NULL,
        "updated_by_id" uniqueidentifier,
        "name" nvarchar(255) NOT NULL,
        "title" nvarchar(MAX),
        "pre_presentation_text" nvarchar(MAX),
        "post_presentation_text" nvarchar(MAX),
        "presentation_request_json" nvarchar(MAX) NOT NULL,
        "data_schema_json" nvarchar(MAX),
        "actions_json" nvarchar(MAX),
        "auto_submit" bit,
        "expires_after_days" int,
        "field_visibility_json" nvarchar(MAX) NOT NULL,
        "is_deleted" bit NOT NULL CONSTRAINT "DF_presentation_flow_template_is_deleted" DEFAULT 0,
        CONSTRAINT "id_presentation_flow_template" PRIMARY KEY ("id")
      )
    `)

    await queryRunner.query(`
      CREATE TABLE "presentation_flow_template_audit" (
        "id" uniqueidentifier NOT NULL,
        "entity_id" uniqueidentifier NOT NULL,
        "audit_data" nvarchar(MAX) NOT NULL,
        "action" nvarchar(255) NOT NULL,
        "audit_date_time" datetimeoffset NOT NULL,
        "user_id" uniqueidentifier,
        CONSTRAINT "id_presentation_flow_template_audit" PRIMARY KEY ("id")
      )
    `)

    await queryRunner.query(`
      ALTER TABLE "presentation_flow_template"
      ADD CONSTRAINT "fk_presentation_flow_template_user_created_by_id" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `)
    await queryRunner.query(`
      ALTER TABLE "presentation_flow_template"
      ADD CONSTRAINT "fk_presentation_flow_template_user_updated_by_id" FOREIGN KEY ("updated_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `)
    await queryRunner.query(`
      ALTER TABLE "presentation_flow_template_audit"
      ADD CONSTRAINT "fk_presentation_flow_template_audit_user_user_id" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `)

    await queryRunner.query(`
      ALTER TABLE "presentation_flow"
      ADD "template_id" uniqueidentifier
    `)
    await queryRunner.query(`
      ALTER TABLE "presentation_flow"
      ADD CONSTRAINT "fk_presentation_flow_template_template_id" FOREIGN KEY ("template_id") REFERENCES "presentation_flow_template"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "presentation_flow" DROP CONSTRAINT "fk_presentation_flow_template_template_id"
    `)
    await queryRunner.query(`
      ALTER TABLE "presentation_flow" DROP COLUMN "template_id"
    `)
    await queryRunner.query(`
      ALTER TABLE "presentation_flow_template_audit" DROP CONSTRAINT "fk_presentation_flow_template_audit_user_user_id"
    `)
    await queryRunner.query(`
      ALTER TABLE "presentation_flow_template" DROP CONSTRAINT "fk_presentation_flow_template_user_updated_by_id"
    `)
    await queryRunner.query(`
      ALTER TABLE "presentation_flow_template" DROP CONSTRAINT "fk_presentation_flow_template_user_created_by_id"
    `)
    await queryRunner.query(`
      DROP TABLE "presentation_flow_template_audit"
    `)
    await queryRunner.query(`
      DROP TABLE "presentation_flow_template"
    `)
  }
}
