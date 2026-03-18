import type { MigrationInterface, QueryRunner } from 'typeorm'

export class FixGeneratedConciergeAuthClient1752560573347 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE "oidc_client" SET "client_type" = 'public' WHERE "id" = '7cb4a314-2322-48bf-a764-b57e50766468'`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
