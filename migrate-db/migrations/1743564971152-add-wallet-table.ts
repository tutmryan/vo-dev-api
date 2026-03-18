import type { MigrationInterface, QueryRunner } from 'typeorm'

export class AddWalletTable1743564971152 implements MigrationInterface {
  name = 'AddWalletTable1743564971152'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "wallet" (
                "id" uniqueidentifier NOT NULL,
                "subject" varchar(255) NOT NULL,
                CONSTRAINT "uq_wallet_subject" UNIQUE ("subject"),
                CONSTRAINT "id_wallet" PRIMARY KEY ("id")
            )
        `)
    await queryRunner.query(`
            ALTER TABLE "presentation"
            ADD "wallet_id" uniqueidentifier
        `)
    await queryRunner.query(`
            ALTER TABLE "presentation"
            ADD CONSTRAINT "fk_presentation_wallet_wallet_id" FOREIGN KEY ("wallet_id") REFERENCES "wallet"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "presentation" DROP CONSTRAINT "fk_presentation_wallet_wallet_id"
        `)
    await queryRunner.query(`
            ALTER TABLE "presentation" DROP COLUMN "wallet_id"
        `)
    await queryRunner.query(`
            DROP TABLE "wallet"
        `)
  }
}
