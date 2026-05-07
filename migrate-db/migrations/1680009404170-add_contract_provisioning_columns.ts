import type { MigrationInterface, QueryRunner } from 'typeorm'

export class addContractProvisioningColumns1680009404170 implements MigrationInterface {
  name = 'addContractProvisioningColumns1680009404170'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "contract"
      ADD "external_id" uniqueidentifier
    `)
    await queryRunner.query(`
      ALTER TABLE "contract"
      ADD "provisioned_at" datetimeoffset
    `)
    await queryRunner.query(`
      ALTER TABLE "contract"
      ADD "provisioned_by_id" uniqueidentifier
    `)
    await queryRunner.query(`
      ALTER TABLE "contract"
      ADD "last_provisioned_at" datetimeoffset
    `)
    await queryRunner.query(`
      ALTER TABLE "contract"
      ADD "last_provisioned_by_id" uniqueidentifier
    `)
    await queryRunner.query(`
      ALTER TABLE "contract"
      ADD CONSTRAINT "fk_contract_user_provisioned_by_id" FOREIGN KEY ("provisioned_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `)
    await queryRunner.query(`
      ALTER TABLE "contract"
      ADD CONSTRAINT "fk_contract_user_last_provisioned_by_id" FOREIGN KEY ("last_provisioned_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "contract" DROP CONSTRAINT "fk_contract_user_provisioned_by_id"
    `)
    await queryRunner.query(`
      ALTER TABLE "contract" DROP COLUMN "provisioned_by_id"
    `)
    await queryRunner.query(`
      ALTER TABLE "contract" DROP COLUMN "provisioned_at"
    `)
    await queryRunner.query(`
      ALTER TABLE "contract" DROP COLUMN "external_id"
    `)
    await queryRunner.query(`
      ALTER TABLE "contract" DROP CONSTRAINT "fk_contract_user_last_provisioned_by_id"
    `)
    await queryRunner.query(`
      ALTER TABLE "contract" DROP COLUMN "last_provisioned_by_id"
    `)
    await queryRunner.query(`
      ALTER TABLE "contract" DROP COLUMN "last_provisioned_at"
    `)
  }
}
