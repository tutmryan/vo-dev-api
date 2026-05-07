import type { MigrationInterface, QueryRunner } from 'typeorm'

export class AddOidcClientPrivateKeyJwtAuth1772000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "oidc_client"
      ADD "token_endpoint_auth_method" nvarchar(50) NULL
    `)
    await queryRunner.query(`
      ALTER TABLE "oidc_client"
      ADD "client_jwks" nvarchar(MAX) NULL
    `)
    await queryRunner.query(`
      ALTER TABLE "oidc_client"
      ADD "client_jwks_uri" nvarchar(MAX) NULL
    `)
    await queryRunner.query(`
      ALTER TABLE "oidc_client"
      ADD "relying_party_jwks" nvarchar(MAX) NULL
    `)
    // Backfill: set token_endpoint_auth_method based on existing clientType
    await queryRunner.query(`
      UPDATE "oidc_client"
      SET "token_endpoint_auth_method" = CASE
        WHEN "client_type" = 'confidential' THEN 'client_secret_post'
        ELSE 'none'
      END
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "oidc_client" DROP COLUMN "relying_party_jwks"
    `)
    await queryRunner.query(`
      ALTER TABLE "oidc_client" DROP COLUMN "client_jwks_uri"
    `)
    await queryRunner.query(`
      ALTER TABLE "oidc_client" DROP COLUMN "client_jwks"
    `)
    await queryRunner.query(`
      ALTER TABLE "oidc_client" DROP COLUMN "token_endpoint_auth_method"
    `)
  }
}
