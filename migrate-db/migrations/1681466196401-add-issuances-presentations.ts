import type { MigrationInterface, QueryRunner } from 'typeorm'

export class AddIssuancesPresentations1681466196401 implements MigrationInterface {
  name = 'AddIssuancesPresentations1681466196401'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "issuance" (
                "id" uniqueidentifier NOT NULL,
                "contract_id" uniqueidentifier NOT NULL,
                "identity_id" uniqueidentifier NOT NULL,
                "user_id" uniqueidentifier NOT NULL,
                "issued_at" datetimeoffset NOT NULL CONSTRAINT "DF_e07ac0b560c58bd3b76eb8e1de8" DEFAULT getdate(),
                CONSTRAINT "id_issuance" PRIMARY KEY ("id")
            )
        `)
    await queryRunner.query(`
            CREATE TABLE "presentation" (
                "id" uniqueidentifier NOT NULL,
                "identity_id" uniqueidentifier,
                "user_id" uniqueidentifier NOT NULL,
                "presented_at" datetimeoffset NOT NULL CONSTRAINT "DF_cc874fa06a6105050feb6495a1a" DEFAULT getdate(),
                "requested_credentials_json" nvarchar(MAX) NOT NULL,
                "presented_credentials_json" nvarchar(MAX) NOT NULL,
                CONSTRAINT "id_presentation" PRIMARY KEY ("id")
            )
        `)
    await queryRunner.query(`
            CREATE TABLE "presentation_contracts" (
                "presentation_id" uniqueidentifier NOT NULL,
                "contract_id" uniqueidentifier NOT NULL,
                CONSTRAINT "id_presentation_contracts" PRIMARY KEY ("presentation_id", "contract_id")
            )
        `)
    await queryRunner.query(`
            CREATE INDEX "ix_presentation_contracts_presentation_id" ON "presentation_contracts" ("presentation_id")
        `)
    await queryRunner.query(`
            CREATE INDEX "ix_presentation_contracts_contract_id" ON "presentation_contracts" ("contract_id")
        `)
    await queryRunner.query(`
            ALTER TABLE "issuance"
            ADD CONSTRAINT "fk_issuance_contract_contract_id" FOREIGN KEY ("contract_id") REFERENCES "contract"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
            ALTER TABLE "issuance"
            ADD CONSTRAINT "fk_issuance_identity_identity_id" FOREIGN KEY ("identity_id") REFERENCES "identity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
            ALTER TABLE "issuance"
            ADD CONSTRAINT "fk_issuance_user_user_id" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
            ALTER TABLE "presentation"
            ADD CONSTRAINT "fk_presentation_identity_identity_id" FOREIGN KEY ("identity_id") REFERENCES "identity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
            ALTER TABLE "presentation"
            ADD CONSTRAINT "fk_presentation_user_user_id" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
            ALTER TABLE "presentation_contracts"
            ADD CONSTRAINT "fk_presentation_contracts_presentation_presentation_id" FOREIGN KEY ("presentation_id") REFERENCES "presentation"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `)
    await queryRunner.query(`
            ALTER TABLE "presentation_contracts"
            ADD CONSTRAINT "fk_presentation_contracts_contract_contract_id" FOREIGN KEY ("contract_id") REFERENCES "contract"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "presentation_contracts" DROP CONSTRAINT "fk_presentation_contracts_contract_contract_id"
        `)
    await queryRunner.query(`
            ALTER TABLE "presentation_contracts" DROP CONSTRAINT "fk_presentation_contracts_presentation_presentation_id"
        `)
    await queryRunner.query(`
            ALTER TABLE "presentation" DROP CONSTRAINT "fk_presentation_user_user_id"
        `)
    await queryRunner.query(`
            ALTER TABLE "presentation" DROP CONSTRAINT "fk_presentation_identity_identity_id"
        `)
    await queryRunner.query(`
            ALTER TABLE "issuance" DROP CONSTRAINT "fk_issuance_user_user_id"
        `)
    await queryRunner.query(`
            ALTER TABLE "issuance" DROP CONSTRAINT "fk_issuance_identity_identity_id"
        `)
    await queryRunner.query(`
            ALTER TABLE "issuance" DROP CONSTRAINT "fk_issuance_contract_contract_id"
        `)
    await queryRunner.query(`
            DROP INDEX "ix_presentation_contracts_contract_id" ON "presentation_contracts"
        `)
    await queryRunner.query(`
            DROP INDEX "ix_presentation_contracts_presentation_id" ON "presentation_contracts"
        `)
    await queryRunner.query(`
            DROP TABLE "presentation_contracts"
        `)
    await queryRunner.query(`
            DROP TABLE "presentation"
        `)
    await queryRunner.query(`
            DROP TABLE "issuance"
        `)
  }
}
