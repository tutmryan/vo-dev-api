import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateReportView1682657380636 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        CREATE VIEW credentials_view AS
        SELECT * FROM contract
      `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        DROP VIEW credentials_view
      `)
  }
}
