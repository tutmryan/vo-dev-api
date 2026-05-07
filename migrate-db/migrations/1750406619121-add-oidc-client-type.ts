import type { MigrationInterface, QueryRunner } from 'typeorm'

export class AddOidcClientType1750406619121 implements MigrationInterface {
  name = 'AddOidcClientType1750406619121'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "oidc_client"
            ADD "client_type" nvarchar(255) NOT NULL CONSTRAINT "DF_bef496c6db1058c6f6627f17ce4" DEFAULT 'public'
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "oidc_client" DROP CONSTRAINT "DF_bef496c6db1058c6f6627f17ce4"
        `)
    await queryRunner.query(`
            ALTER TABLE "oidc_client" DROP COLUMN "client_type"
        `)
  }
}
