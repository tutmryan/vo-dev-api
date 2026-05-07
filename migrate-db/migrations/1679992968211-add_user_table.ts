import type { MigrationInterface, QueryRunner } from 'typeorm'

export class addUserTable1679992968211 implements MigrationInterface {
  name = 'addUserTable1679992968211'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "user" (
        "id" uniqueidentifier NOT NULL,
        "oid" uniqueidentifier NOT NULL,
        "tenant_id" uniqueidentifier NOT NULL,
        "email" nvarchar(255),
        "name" nvarchar(255) NOT NULL,
        "is_app" bit NOT NULL,
        CONSTRAINT "id_user" PRIMARY KEY ("id")
      )
    `)
    await queryRunner.query(`
      CREATE UNIQUE INDEX "ix_user_tenant_id_oid" ON "user" ("tenant_id", "oid")
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "ix_user_tenant_id_oid" ON "user"
    `)
    await queryRunner.query(`
      DROP TABLE "user"
    `)
  }
}
