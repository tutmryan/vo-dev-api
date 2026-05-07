import type { MigrationInterface, QueryRunner } from 'typeorm'

export class addIdentityTable1679561456242 implements MigrationInterface {
  name = 'addIdentityTable1679561456242'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "identity" (
        "id" uniqueidentifier NOT NULL,
        "issuer" nvarchar(255) NOT NULL,
        "identifier" nvarchar(255) NOT NULL,
        "name" nvarchar(255) NOT NULL,
        CONSTRAINT "id_identity" PRIMARY KEY ("id")
      )
    `)
    await queryRunner.query(`
      CREATE UNIQUE INDEX "ix_identity_issuer_identifier" ON "identity" ("issuer", "identifier")
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "ix_identity_issuer_identifier" ON "identity"
    `)
    await queryRunner.query(`
      DROP TABLE "identity"
    `)
  }
}
