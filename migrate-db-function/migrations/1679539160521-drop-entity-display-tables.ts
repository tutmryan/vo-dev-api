import { MigrationInterface, QueryRunner } from 'typeorm'

export class dropEntityDisplayTables1679539160521 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
    ALTER TABLE "template" DROP CONSTRAINT "fk_template_template_display_display_id"
`)
    await queryRunner.query(`
    ALTER TABLE "template_display_claim" DROP CONSTRAINT "fk_template_display_claim_template_display_display_id"
`)
    await queryRunner.query(`
    ALTER TABLE "template_display" DROP CONSTRAINT "fk_template_display_template_display_consent_consent_id"
`)
    await queryRunner.query(`
    ALTER TABLE "template_display" DROP CONSTRAINT "fk_template_display_template_display_credential_card_id"
`)
    await queryRunner.query(`
    ALTER TABLE "template_display_credential" DROP CONSTRAINT "fk_template_display_credential_template_display_credential_logo"
`)
    await queryRunner.query(`
    DROP INDEX "rel_template_display_id" ON "template"
`)
    await queryRunner.query(`
    DROP TABLE "template_display_claim"
`)
    await queryRunner.query(`
    DROP INDEX "rel_template_display_consent_id" ON "template_display"
`)
    await queryRunner.query(`
    DROP INDEX "rel_template_display_card_id" ON "template_display"
`)
    await queryRunner.query(`
    DROP TABLE "template_display"
`)
    await queryRunner.query(`
    DROP INDEX "rel_template_display_credential_logo_id" ON "template_display_credential"
`)
    await queryRunner.query(`
    DROP TABLE "template_display_credential"
`)
    await queryRunner.query(`
    DROP TABLE "template_display_credential_logo"
`)
    await queryRunner.query(`
    DROP TABLE "template_display_consent"
`)
    await queryRunner.query(`
  ALTER TABLE "template" DROP COLUMN "display_id"
  `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
