import type { MigrationInterface, QueryRunner } from 'typeorm'

export class AddApprovalRequestTable1710754461467 implements MigrationInterface {
  name = 'AddApprovalRequestTable1710754461467'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "approval_request_audit" (
                "id" uniqueidentifier NOT NULL,
                "entity_id" uniqueidentifier NOT NULL,
                "audit_data" nvarchar(MAX) NOT NULL,
                "action" nvarchar(255) NOT NULL,
                "audit_date_time" datetimeoffset NOT NULL,
                "user_id" uniqueidentifier,
                CONSTRAINT "id_approval_request_audit" PRIMARY KEY ("id")
            )
        `)
    await queryRunner.query(`
            CREATE TABLE "approval_request" (
                "id" uniqueidentifier NOT NULL,
                "created_at" datetimeoffset NOT NULL CONSTRAINT "DF_77dad76c97ccee3ca87d97c777b" DEFAULT getdate(),
                "updated_at" datetimeoffset CONSTRAINT "DF_1f7062ff91d6b06f97b2f0f7649" DEFAULT getdate(),
                "created_by_id" uniqueidentifier NOT NULL,
                "updated_by_id" uniqueidentifier,
                "expires_at" datetimeoffset NOT NULL,
                "request_type" nvarchar(255) NOT NULL,
                "correlation_id" nvarchar(255),
                "reference_url" nvarchar(255),
                "purpose" nvarchar(255),
                "request_data_json" nvarchar(MAX),
                "callback_json" nvarchar(MAX),
                "presentation_request_json" nvarchar(MAX) NOT NULL,
                "presentation_id" uniqueidentifier,
                "is_approved" bit,
                "actioned_comment" nvarchar(255),
                CONSTRAINT "id_approval_request" PRIMARY KEY ("id")
            )
        `)
    await queryRunner.query(`
            ALTER TABLE "approval_request_audit"
            ADD CONSTRAINT "fk_approval_request_audit_user_user_id" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
            ALTER TABLE "approval_request"
            ADD CONSTRAINT "fk_approval_request_user_created_by_id" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
            ALTER TABLE "approval_request"
            ADD CONSTRAINT "fk_approval_request_user_updated_by_id" FOREIGN KEY ("updated_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
            ALTER TABLE "approval_request"
            ADD CONSTRAINT "fk_approval_request_presentation_presentation_id" FOREIGN KEY ("presentation_id") REFERENCES "presentation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "approval_request" DROP CONSTRAINT "fk_approval_request_presentation_presentation_id"
        `)
    await queryRunner.query(`
            ALTER TABLE "approval_request" DROP CONSTRAINT "fk_approval_request_user_updated_by_id"
        `)
    await queryRunner.query(`
            ALTER TABLE "approval_request" DROP CONSTRAINT "fk_approval_request_user_created_by_id"
        `)
    await queryRunner.query(`
            ALTER TABLE "approval_request_audit" DROP CONSTRAINT "fk_approval_request_audit_user_user_id"
        `)
    await queryRunner.query(`
            DROP TABLE "approval_request"
        `)
    await queryRunner.query(`
            DROP TABLE "approval_request_audit"
        `)
  }
}
