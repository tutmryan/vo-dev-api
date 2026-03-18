import type { MigrationInterface, QueryRunner } from 'typeorm'

export class addContractTable1679908946895 implements MigrationInterface {
  name = 'addContractTable1679908946895'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "contract" (
        "id" uniqueidentifier NOT NULL,
        "name" nvarchar(255) NOT NULL,
        "description" nvarchar(255) NOT NULL,
        "template_id" uniqueidentifier,
        "is_public" bit NOT NULL,
        "validity_interval_in_seconds" int NOT NULL,
        "display_json" nvarchar(MAX) NOT NULL,
        "credential_types_json" nvarchar(MAX) NOT NULL,
        CONSTRAINT "id_contract" PRIMARY KEY ("id")
      )
   `)
    await queryRunner.query(`
      ALTER TABLE "contract"
      ADD CONSTRAINT "fk_contract_template_template_id" FOREIGN KEY ("template_id") REFERENCES "template"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
   `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "contract" DROP CONSTRAINT "fk_contract_template_template_id"
   `)
    await queryRunner.query(`
      DROP TABLE "contract"
   `)
  }
}
