import type { MigrationInterface, QueryRunner } from 'typeorm'

export class RemoveContractDescription1696578535140 implements MigrationInterface {
  name = 'RemoveContractDescription1696578535140'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "contract" DROP COLUMN "description"
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "contract"
            ADD "description" nvarchar(255) NOT NULL
        `)
  }
}
