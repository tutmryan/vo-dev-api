import type { MigrationInterface, QueryRunner } from 'typeorm'

export class DeleteUnusedIndex1750406209292 implements MigrationInterface {
  name = 'DeleteUnusedIndex1750406209292'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX "ix_presentation_wallet_identity" ON "presentation"
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE INDEX "ix_presentation_wallet_identity" ON "presentation" ("wallet_id", "identity_id")
        `)
  }
}
