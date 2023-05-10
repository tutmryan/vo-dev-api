import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddApiUserToReportDataViewer1683615537059 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        IF EXISTS
          (SELECT name
          FROM master.sys.server_principals
          WHERE name = 'api_user')
        BEGIN
          ALTER ROLE [report_data_viewer] ADD MEMBER [api_user]
        END
      `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
