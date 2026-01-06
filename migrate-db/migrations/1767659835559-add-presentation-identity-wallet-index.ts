import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddPresentationIdentityWalletIndex1767659835559 implements MigrationInterface {
  name = 'AddPresentationIdentityWalletIndex1767659835559'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX "ix_presentation_identity_id_wallet_id" ON "presentation" ("identity_id", "wallet_id")
      INCLUDE ("oidc_client_id", "presented_at", "presented_credentials_json", "receipt_json", "request_id", "requested_by_id", "requested_credentials_json")
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "ix_presentation_identity_id_wallet_id" ON "presentation"
    `)
  }
}
