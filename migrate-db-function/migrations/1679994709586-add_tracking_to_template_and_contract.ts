import { MigrationInterface, QueryRunner } from 'typeorm'

export class addTrackingToTemplateAndContract1679994709586 implements MigrationInterface {
  name = 'addTrackingToTemplateAndContract1679994709586'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "contract"
      ADD "created_at" datetimeoffset NOT NULL CONSTRAINT "DF_74ff898cf8b0a90b9a48958d5c0" DEFAULT getdate()
    `)
    await queryRunner.query(`
      ALTER TABLE "contract"
      ADD "updated_at" datetimeoffset CONSTRAINT "DF_0db88a9b828754e05dcc3aa2674" DEFAULT getdate()
    `)
    await queryRunner.query(`
      ALTER TABLE "contract"
      ADD "created_by_id" uniqueidentifier NOT NULL
    `)
    await queryRunner.query(`
      ALTER TABLE "contract"
      ADD "updated_by_id" uniqueidentifier
    `)
    await queryRunner.query(`
      ALTER TABLE "template"
      ADD "created_at" datetimeoffset NOT NULL CONSTRAINT "DF_69e781fed3b794d38166c10cd80" DEFAULT getdate()
    `)
    await queryRunner.query(`
      ALTER TABLE "template"
      ADD "updated_at" datetimeoffset CONSTRAINT "DF_07a8065dd856d76d7fb20a4b206" DEFAULT getdate()
    `)
    await queryRunner.query(`
      ALTER TABLE "template"
      ADD "created_by_id" uniqueidentifier NOT NULL
    `)
    await queryRunner.query(`
      ALTER TABLE "template"
      ADD "updated_by_id" uniqueidentifier
    `)
    await queryRunner.query(`
      ALTER TABLE "contract"
      ADD CONSTRAINT "fk_contract_user_created_by_id" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `)
    await queryRunner.query(`
      ALTER TABLE "contract"
      ADD CONSTRAINT "fk_contract_user_updated_by_id" FOREIGN KEY ("updated_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `)
    await queryRunner.query(`
      ALTER TABLE "template"
      ADD CONSTRAINT "fk_template_user_created_by_id" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `)
    await queryRunner.query(`
      ALTER TABLE "template"
      ADD CONSTRAINT "fk_template_user_updated_by_id" FOREIGN KEY ("updated_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "template" DROP CONSTRAINT "fk_template_user_updated_by_id"
    `)
    await queryRunner.query(`
      ALTER TABLE "template" DROP CONSTRAINT "fk_template_user_created_by_id"
    `)
    await queryRunner.query(`
      ALTER TABLE "contract" DROP CONSTRAINT "fk_contract_user_updated_by_id"
    `)
    await queryRunner.query(`
      ALTER TABLE "contract" DROP CONSTRAINT "fk_contract_user_created_by_id"
    `)
    await queryRunner.query(`
      ALTER TABLE "template" DROP COLUMN "updated_by_id"
    `)
    await queryRunner.query(`
      ALTER TABLE "template" DROP COLUMN "created_by_id"
    `)
    await queryRunner.query(`
      ALTER TABLE "template" DROP CONSTRAINT "DF_07a8065dd856d76d7fb20a4b206"
    `)
    await queryRunner.query(`
      ALTER TABLE "template" DROP COLUMN "updated_at"
    `)
    await queryRunner.query(`
      ALTER TABLE "template" DROP CONSTRAINT "DF_69e781fed3b794d38166c10cd80"
    `)
    await queryRunner.query(`
      ALTER TABLE "template" DROP COLUMN "created_at"
    `)
    await queryRunner.query(`
      ALTER TABLE "contract" DROP COLUMN "updated_by_id"
    `)
    await queryRunner.query(`
      ALTER TABLE "contract" DROP COLUMN "created_by_id"
    `)
    await queryRunner.query(`
      ALTER TABLE "contract" DROP CONSTRAINT "DF_0db88a9b828754e05dcc3aa2674"
    `)
    await queryRunner.query(`
      ALTER TABLE "contract" DROP COLUMN "updated_at"
    `)
    await queryRunner.query(`
      ALTER TABLE "contract" DROP CONSTRAINT "DF_74ff898cf8b0a90b9a48958d5c0"
    `)
    await queryRunner.query(`
      ALTER TABLE "contract" DROP COLUMN "created_at"
    `)
  }
}
