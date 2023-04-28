import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateReportView1682657380636 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        CREATE VIEW credentials_view AS
        SELECT * FROM contract
      `)

    await queryRunner.query(`
        GRANT SELECT ON credentials_view TO report_data_viewer
      `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      REVOKE SELECT ON credentials_view FROM report_data_viewer
      `)

    await queryRunner.query(`
        DROP VIEW credentials_view
      `)
  }
}
