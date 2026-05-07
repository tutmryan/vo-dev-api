import type { MigrationInterface, QueryRunner } from 'typeorm'

export class AddIssuanceIndexRecommended1709871153119 implements MigrationInterface {
  name = 'AddIssuanceIndexRecommended1709871153119'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE INDEX "ix_issuance_contract_id_issued_at" ON "issuance" ("contract_id", "issued_at")
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX "ix_issuance_contract_id_issued_at" ON "issuance"
        `)
  }
}
