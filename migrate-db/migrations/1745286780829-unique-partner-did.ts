import { createHash } from 'crypto'
import { MigrationInterface, QueryRunner } from 'typeorm'

export class UniquePartnerDid1745286780829 implements MigrationInterface {
  name = 'UniquePartnerDid1745286780829'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Migration AddDeletedAtToPartnerAndUQOnDid1742803480124 which has been deleted has been rolled out to some environments
    // and not to others.

    // This part of the migration aligns existing DBs state
    const hasDeletedAtColumn = await queryRunner.query(
      `SELECT COUNT(*) count FROM information_schema.columns WHERE table_name = 'partner' AND column_name = 'deleted_at'`,
    )
    if (hasDeletedAtColumn[0].count === 0) {
      await queryRunner.query(`
        ALTER TABLE "partner"
        ADD "deleted_at" datetimeoffset
      `)
    }

    await queryRunner.query(`ALTER TABLE "partner" DROP CONSTRAINT IF EXISTS "uq_partner_did"`)

    await queryRunner.query(`
      ALTER TABLE "partner"
      ALTER COLUMN "did" nvarchar(max) NOT NULL
    `)

    // This part of the migration aligns all DBs with the new state
    await queryRunner.query(`
      ALTER TABLE "partner"
      ADD "did_hash" varchar(255) NULL
    `)

    const partners = await queryRunner.query(`SELECT id, did FROM "partner"`)
    for (const partner of partners) {
      await queryRunner.query(`UPDATE "partner" SET "did_hash" = @0 WHERE "id" = @1`, [
        createHash('sha256').update(partner.did).digest('base64'),
        partner.id,
      ])
    }

    await queryRunner.query(`
      ALTER TABLE "partner"
      ALTER COLUMN "did_hash" varchar(255) NOT NULL
    `)

    await queryRunner.query(`
      ALTER TABLE "partner"
      ADD CONSTRAINT "uq_partner_did_hash" UNIQUE ("did_hash")
  `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    throw new Error('Down migration not implemented')
  }
}
