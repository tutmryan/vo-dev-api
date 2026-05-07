import type { MigrationInterface, QueryRunner } from 'typeorm'

export class DropCredentialsView1683613114931 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP VIEW credentials_view
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
