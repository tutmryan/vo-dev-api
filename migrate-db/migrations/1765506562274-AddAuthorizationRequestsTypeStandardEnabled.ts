import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddAuthorizationRequestsTypeStandardEnabled1765506562274 implements MigrationInterface {
  name = 'AddAuthorizationRequestsTypeStandardEnabled1765506562274'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "oidc_client" ADD "authorization_request_type_standard_enabled" bit NOT NULL CONSTRAINT "DF_oidc_client_authorization_request_type_standard_enabled" DEFAULT 1`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "oidc_client" DROP CONSTRAINT "DF_oidc_client_authorization_request_type_standard_enabled"`)
    await queryRunner.query(`ALTER TABLE "oidc_client" DROP COLUMN "authorization_request_type_standard_enabled"`)
  }
}
