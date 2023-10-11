import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddIssuanceAudit1697007587287 implements MigrationInterface {
  name = 'AddIssuanceAudit1697007587287'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "issuance_audit" (
                "id" uniqueidentifier NOT NULL,
                "entity_id" uniqueidentifier NOT NULL,
                "audit_data" nvarchar(MAX) NOT NULL,
                "action" nvarchar(255) NOT NULL,
                "audit_date_time" datetimeoffset NOT NULL,
                "user_id" uniqueidentifier,
                CONSTRAINT "id_issuance_audit" PRIMARY KEY ("id")
            )
        `)

    await queryRunner.query(`
            ALTER TABLE "issuance"
            ADD "created_at" datetimeoffset NOT NULL CONSTRAINT "DF_888ce2e0c1ddb5609f777614849" DEFAULT getdate()
        `)
    await queryRunner.query(`
            ALTER TABLE "issuance"
            ADD "updated_at" datetimeoffset CONSTRAINT "DF_7fe350d243d1559ea0639777ede" DEFAULT getdate()
        `)
    await queryRunner.query(`
            ALTER TABLE "issuance"
            ADD "created_by_id" uniqueidentifier
        `)
    await queryRunner.query(`
            ALTER TABLE "issuance"
            ADD "updated_by_id" uniqueidentifier
        `)

    await queryRunner.query(`
            UPDATE [identity]
            SET
                [identity].created_by_id = ISNULL([default_user].id, [any_user].id)
            FROM [dbo].[identity]
            FULL OUTER JOIN (SELECT TOP 1 [id] FROM [dbo].[user] WHERE [id] = 'E1D86910-779C-4129-A2D2-22D128589A02') AS [default_user] ON 1=1
            CROSS JOIN (SELECT TOP 1 [id] FROM [dbo].[user]) AS [any_user]
            WHERE [identity].[created_by_id] IS NULL

            UPDATE [partner]
            SET
                [partner].created_by_id = ISNULL([default_user].id, [any_user].id)
            FROM [dbo].[partner]
            FULL OUTER JOIN (SELECT TOP 1 [id] FROM [dbo].[user] WHERE [id] = 'E1D86910-779C-4129-A2D2-22D128589A02') AS [default_user] ON 1=1
            CROSS JOIN (SELECT TOP 1 [id] FROM [dbo].[user]) AS [any_user]
            WHERE [partner].[created_by_id] IS NULL

            UPDATE [issuance]
            SET
                [issuance].created_by_id = [issuance].issued_by_id,
                [issuance].updated_by_id = [issuance].revoked_by_id
            FROM [dbo].[issuance]
            WHERE [issuance].[created_by_id] IS NULL
        `)

    await queryRunner.query(`
            ALTER TABLE "issuance"
            ALTER COLUMN "created_by_id" uniqueidentifier NOT NULL
        `)
    await queryRunner.query(`
            ALTER TABLE "identity" DROP CONSTRAINT "fk_identity_user_created_by_id"
        `)
    await queryRunner.query(`
            ALTER TABLE "identity"
            ALTER COLUMN "created_by_id" uniqueidentifier NOT NULL
        `)
    await queryRunner.query(`
            ALTER TABLE "partner" DROP CONSTRAINT "fk_partner_user_created_by_id"
        `)
    await queryRunner.query(`
            ALTER TABLE "partner"
            ALTER COLUMN "created_by_id" uniqueidentifier NOT NULL
        `)
    await queryRunner.query(`
            ALTER TABLE "identity"
            ADD CONSTRAINT "fk_identity_user_created_by_id" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
            ALTER TABLE "issuance_audit"
            ADD CONSTRAINT "fk_issuance_audit_user_user_id" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
            ALTER TABLE "partner"
            ADD CONSTRAINT "fk_partner_user_created_by_id" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
            ALTER TABLE "issuance"
            ADD CONSTRAINT "fk_issuance_user_created_by_id" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
            ALTER TABLE "issuance"
            ADD CONSTRAINT "fk_issuance_user_updated_by_id" FOREIGN KEY ("updated_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "issuance" DROP CONSTRAINT "fk_issuance_user_updated_by_id"
        `)
    await queryRunner.query(`
            ALTER TABLE "issuance" DROP CONSTRAINT "fk_issuance_user_created_by_id"
        `)
    await queryRunner.query(`
            ALTER TABLE "partner" DROP CONSTRAINT "fk_partner_user_created_by_id"
        `)
    await queryRunner.query(`
            ALTER TABLE "issuance_audit" DROP CONSTRAINT "fk_issuance_audit_user_user_id"
        `)
    await queryRunner.query(`
            ALTER TABLE "identity" DROP CONSTRAINT "fk_identity_user_created_by_id"
        `)
    await queryRunner.query(`
            ALTER TABLE "partner"
            ALTER COLUMN "created_by_id" uniqueidentifier
        `)
    await queryRunner.query(`
            ALTER TABLE "partner"
            ADD CONSTRAINT "fk_partner_user_created_by_id" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
            ALTER TABLE "identity"
            ALTER COLUMN "created_by_id" uniqueidentifier
        `)
    await queryRunner.query(`
            ALTER TABLE "identity"
            ADD CONSTRAINT "fk_identity_user_created_by_id" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
            ALTER TABLE "issuance" DROP COLUMN "updated_by_id"
        `)
    await queryRunner.query(`
            ALTER TABLE "issuance" DROP COLUMN "created_by_id"
        `)
    await queryRunner.query(`
            ALTER TABLE "issuance" DROP CONSTRAINT "DF_7fe350d243d1559ea0639777ede"
        `)
    await queryRunner.query(`
            ALTER TABLE "issuance" DROP COLUMN "updated_at"
        `)
    await queryRunner.query(`
            ALTER TABLE "issuance" DROP CONSTRAINT "DF_888ce2e0c1ddb5609f777614849"
        `)
    await queryRunner.query(`
            ALTER TABLE "issuance" DROP COLUMN "created_at"
        `)
    await queryRunner.query(`
            DROP TABLE "issuance_audit"
        `)
  }
}
