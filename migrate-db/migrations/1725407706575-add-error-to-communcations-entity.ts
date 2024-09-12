import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddErrorToCommuncationsEntity1725407706575 implements MigrationInterface {
  name = 'AddErrorToCommuncationsEntity1725407706575'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "communication"
            ADD "error" nvarchar(255)
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "communication" DROP COLUMN "error"
        `)
  }
}
