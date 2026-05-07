import type { MigrationInterface, QueryRunner } from 'typeorm'

export class DropViews1698807093763 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        DROP VIEW contract_view
    `)
    await queryRunner.query(`
        DROP VIEW issuance_view
    `)
    await queryRunner.query(`
        DROP VIEW presentation_contracts_view
    `)
    await queryRunner.query(`
        DROP VIEW presentation_view
    `)
    await queryRunner.query(`
        DROP VIEW template_view
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
