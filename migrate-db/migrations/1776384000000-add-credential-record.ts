import type { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * Combined migration for the credential-record feature (PL-2395).
 *
 * Consolidates the following individual migrations into one idempotent script:
 *   - 1774911632721-add-credential-record-table
 *   - 1775000000000-add-credential-record-context-columns
 *   - 1775100000000-add-credential-record-query-indexes
 *   - 1775200000000-add-has-verification-communication-flag
 *   - 1775300000000-add-credential-record-created-at-index
 *   - 1775400000000-add-credential-record-failed-at
 *   - 1776260000000-add-credential-record-cancelled-at
 *
 * All DDL statements are idempotent – safe to run on a database that already has
 * some or all of these structures in place.
 */
export class AddCredentialRecord1776384000000 implements MigrationInterface {
  name = 'AddCredentialRecord1776384000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── credential_record table ──────────────────────────────────────────────
    await queryRunner.query(`
      IF OBJECT_ID('credential_record', 'U') IS NULL
        CREATE TABLE "credential_record" (
          "id"            uniqueidentifier NOT NULL,
          "created_at"    datetimeoffset   NOT NULL CONSTRAINT "DF_credential_record_created_at" DEFAULT getdate(),
          "created_by_id" uniqueidentifier NOT NULL,
          CONSTRAINT "id_credential_record" PRIMARY KEY ("id")
        )
    `)

    // Context columns (originally a separate migration)
    await queryRunner.query(`
      IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'credential_record') AND name = 'contract_id')
        ALTER TABLE "credential_record" ADD "contract_id" uniqueidentifier NULL
    `)
    await queryRunner.query(`
      IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'credential_record') AND name = 'identity_id')
        ALTER TABLE "credential_record" ADD "identity_id" uniqueidentifier NULL
    `)
    await queryRunner.query(`
      IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'credential_record') AND name = 'expires_at')
        ALTER TABLE "credential_record" ADD "expires_at" datetimeoffset NULL
    `)

    // failed_at column – tracks in-person issuance failures (originally a separate migration)
    await queryRunner.query(`
      IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'credential_record') AND name = 'failed_at')
        ALTER TABLE "credential_record" ADD "failed_at" datetimeoffset NULL
    `)

    // cancelled_at column – tracks cancelled in-person issuance offers
    await queryRunner.query(`
      IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'credential_record') AND name = 'cancelled_at')
        ALTER TABLE "credential_record" ADD "cancelled_at" datetimeoffset NULL
    `)

    // ── Foreign keys on credential_record ────────────────────────────────────
    await queryRunner.query(`
      IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_credential_record_user_created_by_id')
        ALTER TABLE "credential_record"
        ADD CONSTRAINT "fk_credential_record_user_created_by_id"
          FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `)
    await queryRunner.query(`
      IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_credential_record_contract_contract_id')
        ALTER TABLE "credential_record"
        ADD CONSTRAINT "fk_credential_record_contract_contract_id"
          FOREIGN KEY ("contract_id") REFERENCES "contract"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `)
    await queryRunner.query(`
      IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_credential_record_identity_identity_id')
        ALTER TABLE "credential_record"
        ADD CONSTRAINT "fk_credential_record_identity_identity_id"
          FOREIGN KEY ("identity_id") REFERENCES "identity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `)

    // ── credential_record_id on issuance & async_issuance ────────────────────
    await queryRunner.query(`
      IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'issuance') AND name = 'credential_record_id')
        ALTER TABLE "issuance" ADD "credential_record_id" uniqueidentifier NULL
    `)
    await queryRunner.query(`
      IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'async_issuance') AND name = 'credential_record_id')
        ALTER TABLE "async_issuance" ADD "credential_record_id" uniqueidentifier NULL
    `)
    await queryRunner.query(`
      IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_issuance_credential_record_credential_record_id')
        ALTER TABLE "issuance"
        ADD CONSTRAINT "fk_issuance_credential_record_credential_record_id"
          FOREIGN KEY ("credential_record_id") REFERENCES "credential_record"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `)
    await queryRunner.query(`
      IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_async_issuance_credential_record_credential_record_id')
        ALTER TABLE "async_issuance"
        ADD CONSTRAINT "fk_async_issuance_credential_record_credential_record_id"
          FOREIGN KEY ("credential_record_id") REFERENCES "credential_record"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `)

    // ── Backfill credential_record from issuance ─────────────────────────────
    // A transient backfill column is used to track the generated → source mapping so
    // the UPDATE that follows can join on it. The IF EXISTS guards ensure this block
    // is a no-op when all issuances already have a credential_record_id assigned.
    await queryRunner.query(`
      IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'credential_record') AND name = 'backfill_issuance_id')
        ALTER TABLE "credential_record" ADD "backfill_issuance_id" uniqueidentifier NULL
    `)
    await queryRunner.query(`
      IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'credential_record') AND name = 'backfill_issuance_id')
      BEGIN
        INSERT INTO "credential_record" ("id", "created_at", "created_by_id", "contract_id", "identity_id", "expires_at", "backfill_issuance_id")
        SELECT NEWID(), i."issued_at", i."issued_by_id", i."contract_id", i."identity_id", i."expires_at", i."id"
        FROM "issuance" i
        WHERE i."credential_record_id" IS NULL
          AND NOT EXISTS (
            SELECT 1 FROM "credential_record" cr WHERE cr."backfill_issuance_id" = i."id"
          )
      END
    `)
    await queryRunner.query(`
      IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'credential_record') AND name = 'backfill_issuance_id')
      BEGIN
        UPDATE i
        SET i."credential_record_id" = cr."id"
        FROM "issuance" i
        INNER JOIN "credential_record" cr ON cr."backfill_issuance_id" = i."id"
        WHERE i."credential_record_id" IS NULL
      END
    `)
    await queryRunner.query(`
      IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'credential_record') AND name = 'backfill_issuance_id')
        ALTER TABLE "credential_record" DROP COLUMN "backfill_issuance_id"
    `)

    // ── Backfill credential_record from async_issuance ───────────────────────
    await queryRunner.query(`
      IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'credential_record') AND name = 'backfill_async_issuance_id')
        ALTER TABLE "credential_record" ADD "backfill_async_issuance_id" uniqueidentifier NULL
    `)
    await queryRunner.query(`
      IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'credential_record') AND name = 'backfill_async_issuance_id')
      BEGIN
        INSERT INTO "credential_record" ("id", "created_at", "created_by_id", "contract_id", "identity_id", "backfill_async_issuance_id")
        SELECT NEWID(), ai."created_at", ai."created_by_id", ai."contract_id", ai."identity_id", ai."id"
        FROM "async_issuance" ai
        WHERE ai."credential_record_id" IS NULL
          AND NOT EXISTS (
            SELECT 1 FROM "credential_record" cr WHERE cr."backfill_async_issuance_id" = ai."id"
          )
      END
    `)
    await queryRunner.query(`
      IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'credential_record') AND name = 'backfill_async_issuance_id')
      BEGIN
        UPDATE ai
        SET ai."credential_record_id" = cr."id"
        FROM "async_issuance" ai
        INNER JOIN "credential_record" cr ON cr."backfill_async_issuance_id" = ai."id"
        WHERE ai."credential_record_id" IS NULL
      END
    `)
    await queryRunner.query(`
      IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'credential_record') AND name = 'backfill_async_issuance_id')
        ALTER TABLE "credential_record" DROP COLUMN "backfill_async_issuance_id"
    `)

    // ── Enforce NOT NULL after backfill ──────────────────────────────────────
    await queryRunner.query(`
      IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'credential_record') AND name = 'contract_id' AND is_nullable = 1)
        ALTER TABLE "credential_record" ALTER COLUMN "contract_id" uniqueidentifier NOT NULL
    `)
    await queryRunner.query(`
      IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'credential_record') AND name = 'identity_id' AND is_nullable = 1)
        ALTER TABLE "credential_record" ALTER COLUMN "identity_id" uniqueidentifier NOT NULL
    `)
    await queryRunner.query(`
      IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'issuance') AND name = 'credential_record_id' AND is_nullable = 1)
        ALTER TABLE "issuance" ALTER COLUMN "credential_record_id" uniqueidentifier NOT NULL
    `)
    await queryRunner.query(`
      IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'async_issuance') AND name = 'credential_record_id' AND is_nullable = 1)
        ALTER TABLE "async_issuance" ALTER COLUMN "credential_record_id" uniqueidentifier NOT NULL
    `)

    // ── Unique indexes on credential_record_id ───────────────────────────────
    await queryRunner.query(`
      IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_issuance_credential_record_id' AND object_id = OBJECT_ID(N'issuance'))
        CREATE UNIQUE INDEX "ix_issuance_credential_record_id" ON "issuance" ("credential_record_id")
    `)
    await queryRunner.query(`
      IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_async_issuance_credential_record_id' AND object_id = OBJECT_ID(N'async_issuance'))
        CREATE UNIQUE INDEX "ix_async_issuance_credential_record_id" ON "async_issuance" ("credential_record_id")
    `)

    // ── Indexes on credential_record columns ─────────────────────────────────
    await queryRunner.query(`
      IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_credential_record_contract_id' AND object_id = OBJECT_ID(N'credential_record'))
        CREATE INDEX "ix_credential_record_contract_id" ON "credential_record" ("contract_id")
    `)
    await queryRunner.query(`
      IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_credential_record_identity_id' AND object_id = OBJECT_ID(N'credential_record'))
        CREATE INDEX "ix_credential_record_identity_id" ON "credential_record" ("identity_id")
    `)
    await queryRunner.query(`
      IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_credential_record_created_at' AND object_id = OBJECT_ID(N'credential_record'))
        CREATE INDEX "ix_credential_record_created_at" ON "credential_record" ("created_at")
    `)

    // ── Performance indexes on related tables ────────────────────────────────
    // Index for verification communication lookups (used by OUTER APPLY in buildBranch2)
    await queryRunner.query(`
      IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_communication_async_issuance_id_purpose' AND object_id = OBJECT_ID(N'communication'))
        CREATE INDEX "ix_communication_async_issuance_id_purpose" ON "communication" ("async_issuance_id", "purpose")
    `)
    // Composite index for issuance status filtering by identity
    await queryRunner.query(`
      IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_issuance_identity_id_is_revoked_expires_at' AND object_id = OBJECT_ID(N'issuance'))
        CREATE INDEX "ix_issuance_identity_id_is_revoked_expires_at" ON "issuance" ("identity_id", "is_revoked", "expires_at")
    `)
    // Composite index for async_issuance status filtering by identity
    await queryRunner.query(`
      IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_async_issuance_identity_id_state_expires_on' AND object_id = OBJECT_ID(N'async_issuance'))
        CREATE INDEX "ix_async_issuance_identity_id_state_expires_on" ON "async_issuance" ("identity_id", "state", "expires_on")
    `)
    // Index for filtering by creator
    await queryRunner.query(`
      IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_issuance_created_by_id' AND object_id = OBJECT_ID(N'issuance'))
        CREATE INDEX "ix_issuance_created_by_id" ON "issuance" ("issued_by_id")
    `)
    await queryRunner.query(`
      IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_async_issuance_created_by_id' AND object_id = OBJECT_ID(N'async_issuance'))
        CREATE INDEX "ix_async_issuance_created_by_id" ON "async_issuance" ("created_by_id")
    `)

    // ── has_verification_communication flag on async_issuance ────────────────
    // Denormalized flag that eliminates the OUTER APPLY subquery on communication
    // in FindCredentialRecordsQuery, significantly improving performance at scale.
    await queryRunner.query(`
      IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'async_issuance') AND name = 'has_verification_communication')
        ALTER TABLE "async_issuance"
        ADD "has_verification_communication" bit NOT NULL
          CONSTRAINT "DF_async_issuance_has_verification_communication" DEFAULT 0
    `)
    // Backfill existing records – idempotent: only sets flag where it is still 0
    // but a matching communication row exists.
    await queryRunner.query(`
      UPDATE ai
      SET ai."has_verification_communication" = 1
      FROM "async_issuance" ai
      WHERE ai."has_verification_communication" = 0
        AND EXISTS (
          SELECT 1 FROM "communication" c
          WHERE c."async_issuance_id" = ai."id"
            AND c."purpose" = 'verification'
        )
    `)
    await queryRunner.query(`
      IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_async_issuance_has_verification_communication' AND object_id = OBJECT_ID(N'async_issuance'))
        CREATE INDEX "ix_async_issuance_has_verification_communication"
        ON "async_issuance" ("has_verification_communication")
        WHERE "has_verification_communication" = 1
    `)

    // ── oidc_identity_resolver_audit table (drift fix) ───────────────────────
    // This table should have been created by 1773622112541-add-oidc-identity-resolver.ts
    // but may be missing. Create it idempotently to fix schema drift.
    await queryRunner.query(`
      IF OBJECT_ID('oidc_identity_resolver_audit', 'U') IS NULL
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
      IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_oidc_identity_resolver_audit_user_user_id')
        ALTER TABLE "oidc_identity_resolver_audit"
        ADD CONSTRAINT "fk_oidc_identity_resolver_audit_user_user_id"
          FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `)

    // ── Fix FK name on oidc_client_identity_resolvers (drift fix) ────────────
    // TypeORM expects the truncated name 'fk_oidc_client_identity_resolvers_oidc_identity_resolver_oidc_i'
    // but a previous migration may have created it with the full name ending in '_oidc_id'.
    await queryRunner.query(`
      IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_oidc_client_identity_resolvers_oidc_identity_resolver_oidc_id')
        ALTER TABLE "oidc_client_identity_resolvers"
        DROP CONSTRAINT "fk_oidc_client_identity_resolvers_oidc_identity_resolver_oidc_id"
    `)
    await queryRunner.query(`
      IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_oidc_client_identity_resolvers_oidc_identity_resolver_oidc_i')
        ALTER TABLE "oidc_client_identity_resolvers"
        ADD CONSTRAINT "fk_oidc_client_identity_resolvers_oidc_identity_resolver_oidc_i"
          FOREIGN KEY ("oidc_identity_resolver_id") REFERENCES "oidc_identity_resolver"("id") ON DELETE CASCADE ON UPDATE CASCADE
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ── has_verification_communication ───────────────────────────────────────
    await queryRunner.query(`
      IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_async_issuance_has_verification_communication' AND object_id = OBJECT_ID(N'async_issuance'))
        DROP INDEX "ix_async_issuance_has_verification_communication" ON "async_issuance"
    `)
    await queryRunner.query(`
      IF EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = 'DF_async_issuance_has_verification_communication' AND parent_object_id = OBJECT_ID(N'async_issuance'))
        ALTER TABLE "async_issuance" DROP CONSTRAINT "DF_async_issuance_has_verification_communication"
    `)
    await queryRunner.query(`
      IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'async_issuance') AND name = 'has_verification_communication')
        ALTER TABLE "async_issuance" DROP COLUMN "has_verification_communication"
    `)

    // ── Performance indexes on related tables ────────────────────────────────
    await queryRunner.query(`
      IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_async_issuance_created_by_id' AND object_id = OBJECT_ID(N'async_issuance'))
        DROP INDEX "ix_async_issuance_created_by_id" ON "async_issuance"
    `)
    await queryRunner.query(`
      IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_issuance_created_by_id' AND object_id = OBJECT_ID(N'issuance'))
        DROP INDEX "ix_issuance_created_by_id" ON "issuance"
    `)
    await queryRunner.query(`
      IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_async_issuance_identity_id_state_expires_on' AND object_id = OBJECT_ID(N'async_issuance'))
        DROP INDEX "ix_async_issuance_identity_id_state_expires_on" ON "async_issuance"
    `)
    await queryRunner.query(`
      IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_issuance_identity_id_is_revoked_expires_at' AND object_id = OBJECT_ID(N'issuance'))
        DROP INDEX "ix_issuance_identity_id_is_revoked_expires_at" ON "issuance"
    `)
    await queryRunner.query(`
      IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_communication_async_issuance_id_purpose' AND object_id = OBJECT_ID(N'communication'))
        DROP INDEX "ix_communication_async_issuance_id_purpose" ON "communication"
    `)

    // ── Indexes on credential_record columns ─────────────────────────────────
    await queryRunner.query(`
      IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_credential_record_created_at' AND object_id = OBJECT_ID(N'credential_record'))
        DROP INDEX "ix_credential_record_created_at" ON "credential_record"
    `)
    await queryRunner.query(`
      IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_credential_record_identity_id' AND object_id = OBJECT_ID(N'credential_record'))
        DROP INDEX "ix_credential_record_identity_id" ON "credential_record"
    `)
    await queryRunner.query(`
      IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_credential_record_contract_id' AND object_id = OBJECT_ID(N'credential_record'))
        DROP INDEX "ix_credential_record_contract_id" ON "credential_record"
    `)

    // ── Unique indexes on credential_record_id ───────────────────────────────
    await queryRunner.query(`
      IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_async_issuance_credential_record_id' AND object_id = OBJECT_ID(N'async_issuance'))
        DROP INDEX "ix_async_issuance_credential_record_id" ON "async_issuance"
    `)
    await queryRunner.query(`
      IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_issuance_credential_record_id' AND object_id = OBJECT_ID(N'issuance'))
        DROP INDEX "ix_issuance_credential_record_id" ON "issuance"
    `)

    // ── FK constraints on issuance / async_issuance ───────────────────────────
    await queryRunner.query(`
      IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_async_issuance_credential_record_credential_record_id')
        ALTER TABLE "async_issuance" DROP CONSTRAINT "fk_async_issuance_credential_record_credential_record_id"
    `)
    await queryRunner.query(`
      IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_issuance_credential_record_credential_record_id')
        ALTER TABLE "issuance" DROP CONSTRAINT "fk_issuance_credential_record_credential_record_id"
    `)

    // ── credential_record_id columns ──────────────────────────────────────────
    await queryRunner.query(`
      IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'async_issuance') AND name = 'credential_record_id')
        ALTER TABLE "async_issuance" DROP COLUMN "credential_record_id"
    `)
    await queryRunner.query(`
      IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'issuance') AND name = 'credential_record_id')
        ALTER TABLE "issuance" DROP COLUMN "credential_record_id"
    `)

    // ── FK constraints on credential_record ───────────────────────────────────
    await queryRunner.query(`
      IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_credential_record_identity_identity_id')
        ALTER TABLE "credential_record" DROP CONSTRAINT "fk_credential_record_identity_identity_id"
    `)
    await queryRunner.query(`
      IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_credential_record_contract_contract_id')
        ALTER TABLE "credential_record" DROP CONSTRAINT "fk_credential_record_contract_contract_id"
    `)
    await queryRunner.query(`
      IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_credential_record_user_created_by_id')
        ALTER TABLE "credential_record" DROP CONSTRAINT "fk_credential_record_user_created_by_id"
    `)

    // ── cancelled_at column ───────────────────────────────────────────────────
    await queryRunner.query(`
      IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'credential_record') AND name = 'cancelled_at')
        ALTER TABLE "credential_record" DROP COLUMN "cancelled_at"
    `)

    // ── Drop credential_record table ──────────────────────────────────────────
    await queryRunner.query(`
      IF OBJECT_ID('credential_record', 'U') IS NOT NULL
        DROP TABLE "credential_record"
    `)

    // ── Revert FK name fix on oidc_client_identity_resolvers ─────────────────
    // Revert from truncated name back to original full name
    await queryRunner.query(`
      IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_oidc_client_identity_resolvers_oidc_identity_resolver_oidc_i')
        ALTER TABLE "oidc_client_identity_resolvers"
        DROP CONSTRAINT "fk_oidc_client_identity_resolvers_oidc_identity_resolver_oidc_i"
    `)
    await queryRunner.query(`
      IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_oidc_client_identity_resolvers_oidc_identity_resolver_oidc_id')
        ALTER TABLE "oidc_client_identity_resolvers"
        ADD CONSTRAINT "fk_oidc_client_identity_resolvers_oidc_identity_resolver_oidc_id"
          FOREIGN KEY ("oidc_identity_resolver_id") REFERENCES "oidc_identity_resolver"("id") ON DELETE CASCADE ON UPDATE CASCADE
    `)

    // ── oidc_identity_resolver_audit table (drift fix revert) ────────────────
    // Note: This table is also managed by 1773622112541-add-oidc-identity-resolver.ts
    // The idempotent checks ensure we don't cause issues if running both migrations' down()
    await queryRunner.query(`
      IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_oidc_identity_resolver_audit_user_user_id')
        ALTER TABLE "oidc_identity_resolver_audit" DROP CONSTRAINT "fk_oidc_identity_resolver_audit_user_user_id"
    `)
    await queryRunner.query(`
      IF OBJECT_ID('oidc_identity_resolver_audit', 'U') IS NOT NULL
        DROP TABLE "oidc_identity_resolver_audit"
    `)
  }
}
