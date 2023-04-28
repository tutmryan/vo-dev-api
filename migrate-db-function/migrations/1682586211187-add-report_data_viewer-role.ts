import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddReportDataViewerRole1682586211187 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE ROLE [report_data_viewer] AUTHORIZATION [dbo]')
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP ROLE [report_data_viewer]')
  }
}
