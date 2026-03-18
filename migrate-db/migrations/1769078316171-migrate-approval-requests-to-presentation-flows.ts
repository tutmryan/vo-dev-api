import type { MigrationInterface, QueryRunner } from 'typeorm'

export class MigrateApprovalRequestsToPresentationFlows1769078316171 implements MigrationInterface {
  name = 'MigrateApprovalRequestsToPresentationFlows1769078316171'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "presentation_flow" (
        "id",
        "created_at",
        "updated_at",
        "created_by_id",
        "updated_by_id",
        "expires_at",
        "correlation_id",
        "title",
        "pre_presentation_text",
        "post_presentation_text",
        "request_data_json",
        "presentation_request_json",
        "actions_json",
        "action_key",
        "callback_json",
        "callback_secret",
        "presentation_id",
        "is_cancelled",
        "is_submitted"
      )
      SELECT
        ar."id",
        ar."created_at",
        ar."updated_at",
        ar."created_by_id",
        ar."updated_by_id",
        ar."expires_at",
        ar."correlation_id",
        'Approval request',
        NULL,
        ar."purpose",
        CASE
          WHEN ar."request_data_json" IS NULL THEN NULL
          WHEN ISJSON(ar."request_data_json") = 1 THEN
            JSON_MODIFY(
              JSON_MODIFY(
                JSON_MODIFY(ar."request_data_json", '$.requestType', ar."request_type"),
                '$.referenceUrl',
                ar."reference_url"
              ),
              '$.purpose',
              ar."purpose"
            )
          ELSE ar."request_data_json"
        END,
        ar."presentation_request_json",
        '[{"key":"APPROVE","label":"Approve"},{"key":"DECLINE","label":"Decline"}]',
        CASE
          WHEN ar."is_cancelled" = 1 THEN NULL
          WHEN ar."is_approved" IS NULL THEN NULL
          WHEN ar."is_approved" = 1 THEN 'APPROVE'
          ELSE 'DECLINE'
        END,
        ar."callback_json",
        ar."callback_secret",
        ar."presentation_id",
        ar."is_cancelled",
        CASE
          WHEN ar."is_cancelled" = 1 THEN NULL
          WHEN ar."is_approved" IS NULL THEN NULL
          ELSE 1
        END
      FROM "approval_request" ar
      WHERE NOT EXISTS (
        SELECT 1 FROM "presentation_flow" pf WHERE pf."id" = ar."id"
      )
    `)

    await queryRunner.query(`
      INSERT INTO "presentation_flow_audit" (
        "id",
        "entity_id",
        "audit_data",
        "action",
        "audit_date_time",
        "user_id"
      )
      SELECT
        ara."id",
        ara."entity_id",
        ara."audit_data",
        ara."action",
        ara."audit_date_time",
        ara."user_id"
      FROM "approval_request_audit" ara
      WHERE EXISTS (
        SELECT 1 FROM "presentation_flow" pf WHERE pf."id" = ara."entity_id"
      )
      AND NOT EXISTS (
        SELECT 1 FROM "presentation_flow_audit" pfa WHERE pfa."id" = ara."id"
      )
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "presentation_flow_audit"
      WHERE "entity_id" IN (
        SELECT "id" FROM "approval_request"
      )
    `)

    await queryRunner.query(`
      DELETE FROM "presentation_flow"
      WHERE "id" IN (
        SELECT "id" FROM "approval_request"
      )
    `)
  }
}
