import type { MigrationInterface, QueryRunner } from 'typeorm'

export class MakeOidcClientTokenEndpointAuthMethodNotNull1776402660544 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Safety backfill: set any remaining nulls (should be none after PL-2438 fix)
    await queryRunner.query(`
      UPDATE "oidc_client"
      SET "token_endpoint_auth_method" = CASE
        WHEN "client_type" = 'confidential' THEN 'client_secret_post'
        ELSE 'none'
      END
      WHERE "token_endpoint_auth_method" IS NULL
    `)
    await queryRunner.query(`
      ALTER TABLE "oidc_client"
      ALTER COLUMN "token_endpoint_auth_method" nvarchar(50) NOT NULL
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "oidc_client"
      ALTER COLUMN "token_endpoint_auth_method" nvarchar(50) NULL
    `)
  }
}
