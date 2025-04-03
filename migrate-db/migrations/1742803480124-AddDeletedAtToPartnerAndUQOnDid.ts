import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDeletedAtToPartnerAndUQOnDid1742803480124 implements MigrationInterface {
  name = 'AddDeletedAtToPartnerAndUQOnDid1742803480124'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "partner"
      ADD "deleted_at" datetimeoffset
    `);

    await queryRunner.query(`
      ALTER TABLE "partner"
      ALTER COLUMN "did" nvarchar(510) NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "partner"
      ADD CONSTRAINT "uq_partner_did" UNIQUE ("did")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "partner"
      DROP CONSTRAINT "uq_partner_did"
    `);

    await queryRunner.query(`
      ALTER TABLE "partner"
      ALTER COLUMN "did" nvarchar(MAX) NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "partner"
      DROP COLUMN "deleted_at"
    `);
  }
}

