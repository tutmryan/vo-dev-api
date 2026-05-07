import type { MigrationInterface, QueryRunner } from 'typeorm'

export class AddPresentationWalletIdentityIndex1749631478008 implements MigrationInterface {
  name = 'AddPresentationWalletIdentityIndex1749631478008'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX "ix_presentation_wallet_identity" ON "presentation" ("wallet_id", "identity_id")
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "ix_presentation_wallet_identity" ON "presentation"
    `)
  }
}
