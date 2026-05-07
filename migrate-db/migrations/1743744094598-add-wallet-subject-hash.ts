import type { MigrationInterface, QueryRunner } from 'typeorm'

export class AddWalletSubjectHash1743744094598 implements MigrationInterface {
  name = 'AddWalletSubjectHash1743744094598'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "wallet"
            ADD "subject_hash" varchar(255) NOT NULL
        `)
    await queryRunner.query(`
            ALTER TABLE "wallet"
            ADD CONSTRAINT "uq_wallet_subject_hash" UNIQUE ("subject_hash")
        `)
    await queryRunner.query(`
            ALTER TABLE "wallet" DROP CONSTRAINT "uq_wallet_subject"
        `)
    await queryRunner.query(`
            ALTER TABLE "wallet" DROP COLUMN "subject"
        `)
    await queryRunner.query(`
            ALTER TABLE "wallet"
            ADD "subject" varchar(MAX) NOT NULL
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "wallet" DROP COLUMN "subject"
        `)
    await queryRunner.query(`
            ALTER TABLE "wallet"
            ADD "subject" varchar(255) NOT NULL
        `)
    await queryRunner.query(`
            ALTER TABLE "wallet"
            ADD CONSTRAINT "uq_wallet_subject" UNIQUE ("subject")
        `)
    await queryRunner.query(`
            ALTER TABLE "wallet" DROP CONSTRAINT "uq_wallet_subject_hash"
        `)
    await queryRunner.query(`
            ALTER TABLE "wallet" DROP COLUMN "subject_hash"
        `)
  }
}
