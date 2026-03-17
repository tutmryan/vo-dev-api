import type { MigrationInterface, QueryRunner } from 'typeorm'

export class AddOidcIdentityResolver1773622112541 implements MigrationInterface {
  name = 'AddOidcIdentityResolver1773622112541'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "oidc_identity_resolver" (
        "id" uniqueidentifier NOT NULL,
        "created_at" datetimeoffset NOT NULL DEFAULT getdate(),
        "updated_at" datetimeoffset DEFAULT getdate(),
        "created_by_id" uniqueidentifier NOT NULL,
        "updated_by_id" uniqueidentifier,
        "deleted_at" datetimeoffset,
        "name" nvarchar(255) NOT NULL,
        "credential_types_json" nvarchar(MAX),
        "claim_name" nvarchar(255) NOT NULL,
        "identity_store_type" nvarchar(50) NOT NULL,
        "identity_store_id" uniqueidentifier NOT NULL,
        "lookup_type" nvarchar(50) NOT NULL,
        CONSTRAINT "id_oidc_identity_resolver" PRIMARY KEY ("id")
      )
    `)

    await queryRunner.query(`
      CREATE TABLE "oidc_identity_resolver_audit" (
        "id" uniqueidentifier NOT NULL,
        "entity_id" uniqueidentifier NOT NULL,
        "audit_data" nvarchar(MAX) NOT NULL,
        "action" nvarchar(255) NOT NULL,
        "audit_date_time" datetimeoffset NOT NULL,
        "user_id" uniqueidentifier,
        CONSTRAINT "id_oidc_identity_resolver_audit" PRIMARY KEY ("id")
      )
    `)

    await queryRunner.query(`
      CREATE TABLE "oidc_client_identity_resolvers" (
        "oidc_client_id" uniqueidentifier NOT NULL,
        "oidc_identity_resolver_id" uniqueidentifier NOT NULL,
        CONSTRAINT "id_oidc_client_identity_resolvers" PRIMARY KEY ("oidc_client_id", "oidc_identity_resolver_id")
      )
    `)

    await queryRunner.query(`
      CREATE INDEX "ix_oidc_client_identity_resolvers_oidc_client_id" ON "oidc_client_identity_resolvers" ("oidc_client_id")
    `)
    await queryRunner.query(`
      CREATE INDEX "ix_oidc_client_identity_resolvers_oidc_identity_resolver_id" ON "oidc_client_identity_resolvers" ("oidc_identity_resolver_id")
    `)

    await queryRunner.query(`
      ALTER TABLE "oidc_identity_resolver"
      ADD CONSTRAINT "fk_oidc_identity_resolver_user_created_by_id" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `)
    await queryRunner.query(`
      ALTER TABLE "oidc_identity_resolver"
      ADD CONSTRAINT "fk_oidc_identity_resolver_user_updated_by_id" FOREIGN KEY ("updated_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `)
    await queryRunner.query(`
      ALTER TABLE "oidc_identity_resolver"
      ADD CONSTRAINT "fk_oidc_identity_resolver_identity_store_identity_store_id" FOREIGN KEY ("identity_store_id") REFERENCES "identity_store"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `)

    await queryRunner.query(`
      ALTER TABLE "oidc_identity_resolver_audit"
      ADD CONSTRAINT "fk_oidc_identity_resolver_audit_user_user_id" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `)

    await queryRunner.query(`
      ALTER TABLE "oidc_client_identity_resolvers"
      ADD CONSTRAINT "fk_oidc_client_identity_resolvers_oidc_client_oidc_client_id" FOREIGN KEY ("oidc_client_id") REFERENCES "oidc_client"("id") ON DELETE CASCADE ON UPDATE CASCADE
    `)
    await queryRunner.query(`
      ALTER TABLE "oidc_client_identity_resolvers"
      ADD CONSTRAINT "fk_oidc_client_identity_resolvers_oidc_identity_resolver_oidc_i" FOREIGN KEY ("oidc_identity_resolver_id") REFERENCES "oidc_identity_resolver"("id") ON DELETE CASCADE ON UPDATE CASCADE
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "oidc_client_identity_resolvers" DROP CONSTRAINT "fk_oidc_client_identity_resolvers_oidc_identity_resolver_oidc_i"
    `)
    await queryRunner.query(`
      ALTER TABLE "oidc_client_identity_resolvers" DROP CONSTRAINT "fk_oidc_client_identity_resolvers_oidc_client_oidc_client_id"
    `)

    await queryRunner.query(`
      ALTER TABLE "oidc_identity_resolver_audit" DROP CONSTRAINT "fk_oidc_identity_resolver_audit_user_user_id"
    `)

    await queryRunner.query(`
      ALTER TABLE "oidc_identity_resolver" DROP CONSTRAINT "fk_oidc_identity_resolver_identity_store_identity_store_id"
    `)
    await queryRunner.query(`
      ALTER TABLE "oidc_identity_resolver" DROP CONSTRAINT "fk_oidc_identity_resolver_user_updated_by_id"
    `)
    await queryRunner.query(`
      ALTER TABLE "oidc_identity_resolver" DROP CONSTRAINT "fk_oidc_identity_resolver_user_created_by_id"
    `)

    await queryRunner.query(`
      DROP INDEX "ix_oidc_client_identity_resolvers_oidc_identity_resolver_id" ON "oidc_client_identity_resolvers"
    `)
    await queryRunner.query(`
      DROP INDEX "ix_oidc_client_identity_resolvers_oidc_client_id" ON "oidc_client_identity_resolvers"
    `)

    await queryRunner.query(`
      DROP TABLE "oidc_client_identity_resolvers"
    `)
    await queryRunner.query(`
      DROP TABLE "oidc_identity_resolver_audit"
    `)
    await queryRunner.query(`
      DROP TABLE "oidc_identity_resolver"
    `)
  }
}
