import type { MigrationInterface, QueryRunner } from 'typeorm'

export class AddFaceCheckSupport1711519302565 implements MigrationInterface {
  name = 'AddFaceCheckSupport1711519302565'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "template"
            ADD "face_check_support" nvarchar(255)
        `)
    await queryRunner.query(`
            ALTER TABLE "contract"
            ADD "face_check_support" nvarchar(255) NOT NULL CONSTRAINT "DF_8b6fb470fba4d4e911fe15f351f" DEFAULT 'none'
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "contract" DROP CONSTRAINT "DF_8b6fb470fba4d4e911fe15f351f"
        `)
    await queryRunner.query(`
            ALTER TABLE "contract" DROP COLUMN "face_check_support"
        `)
    await queryRunner.query(`
            ALTER TABLE "template" DROP COLUMN "face_check_support"
        `)
  }
}
