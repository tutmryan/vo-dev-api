import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddActionCommentToApprovalRequestsMigratedToPresentationFlows1772617459384 implements MigrationInterface {
  name = 'AddActionCommentToApprovalRequestsMigratedToPresentationFlows1772617459384'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE pf
      SET
        pf."data_schema_json" = '[{"id":"comment","type":"text","label":"Comment","required":false}]',
        pf."data_results_json" = CASE
          WHEN ar."actioned_comment" IS NOT NULL AND ar."actioned_comment" != ''
            THEN '{"comment":' + (SELECT '"' + STRING_ESCAPE(ar."actioned_comment", 'json') + '"') + '}'
          ELSE NULL
        END
      FROM "presentation_flow" pf
      INNER JOIN "approval_request" ar ON ar."id" = pf."id"
      WHERE pf."data_schema_json" IS NULL
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE pf
      SET
        pf."data_schema_json" = NULL,
        pf."data_results_json" = NULL
      FROM "presentation_flow" pf
      INNER JOIN "approval_request" ar ON ar."id" = pf."id"
    `)
  }
}
