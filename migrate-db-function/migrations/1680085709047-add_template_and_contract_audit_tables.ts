import { MigrationInterface, QueryRunner } from 'typeorm'

export class addTemplateAndContractAuditTables1680085709047 implements MigrationInterface {
  name = 'addTemplateAndContractAuditTables1680085709047'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "contract_audit" (
        "id" uniqueidentifier NOT NULL,
        "entity_id" uniqueidentifier NOT NULL,
        "audit_data" nvarchar(MAX) NOT NULL,
        "action" nvarchar(255) NOT NULL,
        "audit_date_time" datetimeoffset NOT NULL,
        "user_id" uniqueidentifier,
        CONSTRAINT "id_contract_audit" PRIMARY KEY ("id")
      )
    `)
    await queryRunner.query(`
      CREATE TABLE "template_audit" (
        "id" uniqueidentifier NOT NULL,
        "entity_id" uniqueidentifier NOT NULL,
        "audit_data" nvarchar(MAX) NOT NULL,
        "action" nvarchar(255) NOT NULL,
        "audit_date_time" datetimeoffset NOT NULL,
        "user_id" uniqueidentifier,
        CONSTRAINT "id_template_audit" PRIMARY KEY ("id")
      )
    `)
    await queryRunner.query(`
      ALTER TABLE "contract_audit"
      ADD CONSTRAINT "fk_contract_audit_user_user_id" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `)
    await queryRunner.query(`
      ALTER TABLE "template_audit"
      ADD CONSTRAINT "fk_template_audit_user_user_id" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "template_audit" DROP CONSTRAINT "fk_template_audit_user_user_id"
    `)
    await queryRunner.query(`
      ALTER TABLE "contract_audit" DROP CONSTRAINT "fk_contract_audit_user_user_id"
    `)
    await queryRunner.query(`
      DROP TABLE "template_audit"
    `)
    await queryRunner.query(`
      DROP TABLE "contract_audit"
    `)
  }
}
