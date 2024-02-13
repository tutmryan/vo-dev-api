import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddApiUserToReportDataViewer1683615537059 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const isLocalDevMigration = process.env.DATABASE_USERNAME === 'sa'

    if (isLocalDevMigration)
      await queryRunner.query(`
        ALTER ROLE [report_data_viewer] ADD MEMBER [api_user]
      `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
