import type { MigrationInterface, QueryRunner } from 'typeorm'

export class AddPresentationPartnerLink1694582482496 implements MigrationInterface {
  name = 'AddPresentationPartnerLink1694582482496'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "presentation_partners" (
                "presentation_id" uniqueidentifier NOT NULL,
                "partner_id" uniqueidentifier NOT NULL,
                CONSTRAINT "id_presentation_partners" PRIMARY KEY ("presentation_id", "partner_id")
            )
        `)
    await queryRunner.query(`
            CREATE INDEX "ix_presentation_partners_presentation_id" ON "presentation_partners" ("presentation_id")
        `)
    await queryRunner.query(`
            CREATE INDEX "ix_presentation_partners_partner_id" ON "presentation_partners" ("partner_id")
        `)
    await queryRunner.query(`
            ALTER TABLE "presentation_partners"
            ADD CONSTRAINT "fk_presentation_partners_presentation_presentation_id" FOREIGN KEY ("presentation_id") REFERENCES "presentation"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `)
    await queryRunner.query(`
            ALTER TABLE "presentation_partners"
            ADD CONSTRAINT "fk_presentation_partners_partner_partner_id" FOREIGN KEY ("partner_id") REFERENCES "partner"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "presentation_partners" DROP CONSTRAINT "fk_presentation_partners_partner_partner_id"
        `)
    await queryRunner.query(`
            ALTER TABLE "presentation_partners" DROP CONSTRAINT "fk_presentation_partners_presentation_presentation_id"
        `)
    await queryRunner.query(`
            DROP INDEX "ix_presentation_partners_partner_id" ON "presentation_partners"
        `)
    await queryRunner.query(`
            DROP INDEX "ix_presentation_partners_presentation_id" ON "presentation_partners"
        `)
    await queryRunner.query(`
            DROP TABLE "presentation_partners"
        `)
  }
}
