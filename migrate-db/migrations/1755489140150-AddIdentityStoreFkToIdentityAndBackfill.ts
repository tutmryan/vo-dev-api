import type { MigrationInterface, QueryRunner } from 'typeorm'

// --- tolerant env parsing helpers (supports {'k':'v'} maps) ---
function parseJsonLike(input: string | undefined, varName: string): Record<string, string> {
  if (!input) return {}
  let s = input.trim()
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) s = s.slice(1, -1)
  s = s.replace(/([{,]\s*)([A-Za-z0-9._-]+)\s*:/g, '$1"$2":')
  s = s.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, (_, m) => `"${m.replace(/"/g, '\\"')}"`)
  s = s.replace(/,(\s*[}\]])/g, '$1')
  try {
    const obj = JSON.parse(s)
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) return obj as Record<string, string>
    throw new Error(`${varName} is not an object`)
  } catch (e) {
    throw new Error(`Failed to parse ${varName}: ${(e as Error).message}\nraw: ${input}`)
  }
}

// supports formats like: ['^http://localhost:?[0-9]*$','^https://foo\\.bar$']
// also accepts JSON: ["a","b"], or a single value: "a"
function parseStringArrayLike(input: string | undefined, varName: string): string[] {
  if (!input) return []
  let s = input.trim()
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) s = s.slice(1, -1).trim()
  const looksBracketed = s.startsWith('[') && s.endsWith(']')
  if (!looksBracketed) {
    const singleToDouble = s.replace(/^'(.*)'$/, (_, m) => `"${m.replace(/"/g, '\\"')}"`)
    try {
      return [String(JSON.parse(singleToDouble))]
    } catch {
      return [s]
    }
  }
  let inner = s.slice(1, -1)
  inner = inner.replace(/,(\s*(?:$|\]))/g, '$1')
  inner = inner.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, (_, m) => `"${m.replace(/"/g, '\\"')}"`)
  try {
    const arr = JSON.parse(`[${inner}]`)
    if (Array.isArray(arr)) return arr.map(String)
    throw new Error(`${varName} is not an array`)
  } catch (e) {
    throw new Error(`Failed to parse ${varName}: ${(e as Error).message}\nraw: ${input}`)
  }
}

export class AddIdentityStoreFkToIdentityAndBackfill1755489140150 implements MigrationInterface {
  name = 'AddIdentityStoreFkToIdentityAndBackfill1755489140150'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1) add column as NULLable for backfill
    await queryRunner.query(`
      ALTER TABLE "identity"
      ADD "identity_store_id" uniqueidentifier NULL
    `)

    // system user id
    const systemUser = (await queryRunner.query(`
      SELECT TOP (1) "id"
      FROM "user"
      WHERE "tenant_id" = '00000000-0000-0000-0000-000000000000'
        AND "is_app" = 1
        AND "name" = 'System'
    `)) as Array<{ id: string }>
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const creatorId = systemUser?.[0]?.id
    if (!creatorId) throw new Error('Backfill aborted: no system user found.')

    // 2a) Manual store (only if used)
    await queryRunner.query(
      `
      IF EXISTS (SELECT 1 FROM "identity" WHERE "issuer" = 'manual')
        AND NOT EXISTS (SELECT 1 FROM "identity_store" WHERE "identifier" = 'manual')
      BEGIN
        INSERT INTO "identity_store" (
          "id","identifier","name","type",
          "is_authentication_enabled","client_id",
          "created_at","updated_at","created_by_id"
        )
        VALUES (
          NEWID(),'manual','Manually Issued','Manual',
          0,NULL,SYSUTCDATETIME(),SYSUTCDATETIME(),'${creatorId}'
        )
      END
    `,
    )

    // 2b) Home (main) store from env variables
    const HOME_TENANT_ID = process.env.HOME_TENANT_ID?.trim()
    const HOME_TENANT_NAME = process.env.HOME_TENANT_NAME?.trim() || 'Home Tenant'
    const HOME_TENANT_GRAPH_CLIENT_ID = process.env.HOME_TENANT_GRAPH_CLIENT_ID?.trim() || null
    if (!HOME_TENANT_ID) throw new Error('HOME_TENANT_ID is required to seed the Home identity store.')
    await queryRunner.query(
      `
      IF NOT EXISTS (SELECT 1 FROM "identity_store" WHERE "identifier" = @0)
      BEGIN
        INSERT INTO "identity_store" (
          "id","identifier","name","type",
          "is_authentication_enabled","client_id",
          "created_at","updated_at","created_by_id"
        )
        VALUES (
          NEWID(), @0, @1, 'Entra',
          1, @2, SYSUTCDATETIME(), SYSUTCDATETIME(), '${creatorId}'
        )
      END
      `,
      [HOME_TENANT_ID, HOME_TENANT_NAME, HOME_TENANT_GRAPH_CLIENT_ID],
    )

    // 2c) Create stores only for issuers that actually exist in identity
    await queryRunner.query(
      `
      INSERT INTO "identity_store" (
        "id","identifier","name","type",
        "is_authentication_enabled","client_id",
        "created_at","updated_at","created_by_id"
      )
      SELECT
        NEWID(),
        d.issuer,
        'Identity Store (' + d.issuer + ')',
        CASE
          WHEN TRY_CONVERT(uniqueidentifier, d.issuer) IS NOT NULL THEN 'Entra'
          WHEN d.issuer LIKE '%login.microsoftonline.com%' OR d.issuer LIKE '%b2clogin.com%' THEN 'Entra'
          ELSE 'Manual'
        END,
        0,
        NULL,
        SYSUTCDATETIME(),
        SYSUTCDATETIME(),
        '${creatorId}'
      FROM (
        SELECT DISTINCT i."issuer" AS issuer
        FROM "identity" i
        WHERE i."issuer" IS NOT NULL AND LTRIM(RTRIM(i."issuer")) <> ''
      ) AS d
      LEFT JOIN "identity_store" ix ON ix."identifier" = d.issuer
      WHERE ix."id" IS NULL
    `,
    )

    // 3) Backfill FK
    await queryRunner.query(`
      UPDATE i
      SET i."identity_store_id" = s."id"
      FROM "identity" i
      JOIN "identity_store" s ON s."identifier" = i."issuer"
      WHERE i."identity_store_id" IS NULL
    `)

    // 4) guardrail
    const rows = (await queryRunner.query(`
      SELECT COUNT(*) AS missing
      FROM "identity"
      WHERE "identity_store_id" IS NULL
    `)) as Array<{ missing: number | string }>
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const missing = Number(rows?.[0]?.missing ?? 0)
    if (missing > 0) throw new Error(`Backfill failed: ${missing} identities have no matching identity_store.`)

    // 5) make NOT NULL
    await queryRunner.query(`
      ALTER TABLE "identity"
      ALTER COLUMN "identity_store_id" uniqueidentifier NOT NULL
    `)

    // 6) add FK
    await queryRunner.query(`
      ALTER TABLE "identity"
      ADD CONSTRAINT "fk_identity_identity_store_identity_store_id"
      FOREIGN KEY ("identity_store_id") REFERENCES "identity_store"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `)

    // 7) ENV-DRIVEN CONFIG SEEDING

    // 7a) CORS origins — one row per string
    const origins = parseStringArrayLike(process.env.CORS_ORIGIN, 'CORS_ORIGIN')
    for (const origin of origins) {
      await queryRunner.query(
        `
        IF NOT EXISTS (SELECT 1 FROM "cors_origin_config" WHERE "origin" = @0)
        INSERT INTO "cors_origin_config" ("id","origin")
        VALUES (NEWID(), @0)
      `,
        [origin],
      )
    }

    // 7b) Application label config — default all to home store
    const appsMap = parseJsonLike(process.env.PLATFORM_CONSUMER_APPS, 'PLATFORM_CONSUMER_APPS')
    const homeStore = (await queryRunner.query(`SELECT TOP (1) id FROM "identity_store" WHERE "identifier" = @0`, [
      HOME_TENANT_ID,
    ])) as Array<{ id: string }>
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const homeStoreId = homeStore?.[0]?.id
    if (!homeStoreId) throw new Error('Home identity store not found after seeding.')

    for (const clientId of Object.keys(appsMap)) {
      const label = appsMap[clientId]
      await queryRunner.query(
        `
        IF NOT EXISTS (SELECT 1 FROM "application_label_config" WHERE "identifier" = @0)
        INSERT INTO "application_label_config" (
          "id","identifier","name","identity_store_id"
        ) VALUES (
          NEWID(), @0, @1, @2
        )
      `,
        [clientId, label, homeStoreId],
      )
    }

    // 7d) Enable authentication for stores listed in ADDITIONAL_AUTH_TENANT_IDS
    // Values in the array must match IdentityStore.identifier exactly.
    const additionalAuthTenantIds = parseStringArrayLike(process.env.ADDITIONAL_AUTH_TENANT_IDS, 'ADDITIONAL_AUTH_TENANT_IDS')

    for (const tenantId of additionalAuthTenantIds) {
      const id = tenantId.trim()
      if (!id) continue

      await queryRunner.query(
        `
        IF EXISTS (SELECT 1 FROM "identity_store" WHERE "identifier" = @0)
        BEGIN
          UPDATE "identity_store"
          SET "is_authentication_enabled" = 1,
              "updated_at" = SYSUTCDATETIME()
          WHERE "identifier" = @0;
        END
        `,
        [id],
      )
    }

    // 7c) Friendly names for existing stores based on IDENTITY_ISSUERS
    const identityIssuersMapRaw = parseJsonLike(process.env.IDENTITY_ISSUERS, 'IDENTITY_ISSUERS')

    for (const [issuerKey, friendly] of Object.entries(identityIssuersMapRaw)) {
      await queryRunner.query(
        `
        UPDATE "identity_store"
        SET "name" = @1, "updated_at" = SYSUTCDATETIME()
        WHERE "identifier" = @0
        `,
        [issuerKey, friendly],
      )
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "identity" DROP CONSTRAINT "fk_identity_identity_store_identity_store_id"`)
    await queryRunner.query(`ALTER TABLE "identity" ALTER COLUMN "identity_store_id" uniqueidentifier NULL`)
    await queryRunner.query(`ALTER TABLE "identity" DROP COLUMN "identity_store_id"`)
  }
}
