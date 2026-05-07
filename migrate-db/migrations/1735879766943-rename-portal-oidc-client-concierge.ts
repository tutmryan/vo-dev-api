import type { MigrationInterface, QueryRunner } from 'typeorm'

export class RenamePortalOidcClientConcierge1735879766943 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "update oidc_client set name = 'Verified Orchestration Concierge' where id = '7cb4a314-2322-48bf-a764-b57e50766468'",
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
