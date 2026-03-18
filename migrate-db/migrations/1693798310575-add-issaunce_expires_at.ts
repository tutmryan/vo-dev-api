import type { MigrationInterface, QueryRunner } from 'typeorm'

export class AddIssaunceExpiresAt1693798310575 implements MigrationInterface {
  name = 'AddIssaunceExpiresAt1693798310575'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "issuance"
      ADD "expires_at" datetimeoffset
        `)

    await queryRunner.query(`
      UPDATE issuance
      SET issuance.expires_at = DATEADD(second, c.validity_interval_in_seconds, i.issued_at)
      FROM issuance i
      INNER JOIN contract c on i.contract_id = c.id
        `)

    await queryRunner.query(`
      ALTER TABLE "issuance"
      ALTER COLUMN issued_at datetimeoffset not null
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "issuance" DROP COLUMN "expires_at"
        `)
  }
}
