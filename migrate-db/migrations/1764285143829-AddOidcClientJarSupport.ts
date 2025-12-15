import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddOidcClientJarSupport1764285143829 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "oidc_client"
      ADD "authorization_request_type_jar_enabled" bit NOT NULL CONSTRAINT "DF_oidc_client_authorization_request_type_jar_enabled" DEFAULT 0
    `)
    await queryRunner.query(`
      ALTER TABLE "oidc_client"
      ADD "relying_party_jwks_uri" nvarchar(MAX) NULL
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "oidc_client" DROP COLUMN "relying_party_jwks_uri"
    `)
    await queryRunner.query(`
      ALTER TABLE "oidc_client" DROP CONSTRAINT "DF_oidc_client_authorization_request_type_jar_enabled"
    `)
    await queryRunner.query(`
      ALTER TABLE "oidc_client" DROP COLUMN "authorization_request_type_jar_enabled"
    `)
  }
}
