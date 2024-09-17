import { MigrationInterface, QueryRunner } from 'typeorm'

export class IncreaseApprovalRequestPurposeFieldSize1726558265962 implements MigrationInterface {
  name = 'IncreaseApprovalRequestPurposeFieldSize1726558265962'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "approval_request" ALTER COLUMN "purpose" nvarchar(MAX)
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
