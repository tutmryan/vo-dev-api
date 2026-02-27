import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddPresentationFlowTable1769077622767 implements MigrationInterface {
  name = 'AddPresentationFlowTable1769077622767'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "presentation_flow" (
        "id" uniqueidentifier NOT NULL,
        "created_at" datetimeoffset NOT NULL CONSTRAINT "DF_presentation_flow_created_at" DEFAULT getdate(),
        "updated_at" datetimeoffset CONSTRAINT "DF_presentation_flow_updated_at" DEFAULT getdate(),
        "created_by_id" uniqueidentifier NOT NULL,
        "updated_by_id" uniqueidentifier,
        "identity_id" uniqueidentifier,
        "expires_at" datetimeoffset NOT NULL,
        "correlation_id" nvarchar(255),
        "title" nvarchar(MAX),
        "pre_presentation_text" nvarchar(MAX),
        "post_presentation_text" nvarchar(MAX),
        "request_data_json" nvarchar(MAX),
        "presentation_request_json" nvarchar(MAX) NOT NULL,
        "data_schema_json" nvarchar(MAX),
        "data_results_json" nvarchar(MAX),
        "actions_json" nvarchar(MAX),
        "auto_submit" bit,
        "action_key" nvarchar(255),
        "callback_json" nvarchar(MAX),
        "callback_secret" uniqueidentifier NOT NULL,
        "presentation_id" uniqueidentifier,
        "is_cancelled" bit,
        "is_submitted" bit,
        CONSTRAINT "id_presentation_flow" PRIMARY KEY ("id")
      )
    `)

    await queryRunner.query(`
      CREATE TABLE "presentation_flow_audit" (
        "id" uniqueidentifier NOT NULL,
        "entity_id" uniqueidentifier NOT NULL,
        "audit_data" nvarchar(MAX) NOT NULL,
        "action" nvarchar(255) NOT NULL,
        "audit_date_time" datetimeoffset NOT NULL,
        "user_id" uniqueidentifier,
        CONSTRAINT "id_presentation_flow_audit" PRIMARY KEY ("id")
      )
    `)

    await queryRunner.query(`
      ALTER TABLE "presentation_flow"
      ADD CONSTRAINT "fk_presentation_flow_user_created_by_id" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `)
    await queryRunner.query(`
      ALTER TABLE "presentation_flow"
      ADD CONSTRAINT "fk_presentation_flow_user_updated_by_id" FOREIGN KEY ("updated_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `)
    await queryRunner.query(`
      ALTER TABLE "presentation_flow"
      ADD CONSTRAINT "fk_presentation_flow_identity_identity_id" FOREIGN KEY ("identity_id") REFERENCES "identity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `)
    await queryRunner.query(`
      ALTER TABLE "presentation_flow"
      ADD CONSTRAINT "fk_presentation_flow_presentation_presentation_id" FOREIGN KEY ("presentation_id") REFERENCES "presentation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `)
    await queryRunner.query(`
      ALTER TABLE "presentation_flow_audit"
      ADD CONSTRAINT "fk_presentation_flow_audit_user_user_id" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "presentation_flow_audit" DROP CONSTRAINT "fk_presentation_flow_audit_user_user_id"
    `)
    await queryRunner.query(`
      ALTER TABLE "presentation_flow" DROP CONSTRAINT "fk_presentation_flow_presentation_presentation_id"
    `)
    await queryRunner.query(`
      ALTER TABLE "presentation_flow" DROP CONSTRAINT "fk_presentation_flow_identity_identity_id"
    `)
    await queryRunner.query(`
      ALTER TABLE "presentation_flow" DROP CONSTRAINT "fk_presentation_flow_user_updated_by_id"
    `)
    await queryRunner.query(`
      ALTER TABLE "presentation_flow" DROP CONSTRAINT "fk_presentation_flow_user_created_by_id"
    `)
    await queryRunner.query(`
      DROP TABLE "presentation_flow_audit"
    `)
    await queryRunner.query(`
      DROP TABLE "presentation_flow"
    `)
  }
}
