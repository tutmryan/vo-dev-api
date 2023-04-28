import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateReportView1682657380636 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        CREATE VIEW report_view_credentials AS
        SELECT * FROM contract
      `)

    await queryRunner.query(`
        GRANT SELECT ON report_view_credentials TO report_data_viewer
      `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      REVOKE SELECT ON report_view_credentials FROM report_data_viewer
      `)

    await queryRunner.query(`
        DROP VIEW report_view_credentials
      `)
  }
}
