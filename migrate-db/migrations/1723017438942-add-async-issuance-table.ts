import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAsyncIssuanceTable1723017438942 implements MigrationInterface {
    name = 'AddAsyncIssuanceTable1723017438942'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "async_issuance" (
                "id" uniqueidentifier NOT NULL,
                "created_at" datetimeoffset NOT NULL CONSTRAINT "DF_191cde56305a05d9f940c61f524" DEFAULT getdate(),
                "updated_at" datetimeoffset CONSTRAINT "DF_f6885f9b39a3b7d6b790459c948" DEFAULT getdate(),
                "created_by_id" uniqueidentifier NOT NULL,
                "updated_by_id" uniqueidentifier,
                "expires_on" datetimeoffset NOT NULL,
                "expiry_period_in_days" smallint NOT NULL,
                "contract_id" uniqueidentifier NOT NULL,
                "identity_id" uniqueidentifier NOT NULL,
                "issuance_id" uniqueidentifier,
                CONSTRAINT "id_async_issuance" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "ix_async_issuance_expires_on" ON "async_issuance" ("expires_on")
        `);
        await queryRunner.query(`
            CREATE TABLE "async_issuance_audit" (
                "id" uniqueidentifier NOT NULL,
                "entity_id" uniqueidentifier NOT NULL,
                "audit_data" nvarchar(MAX) NOT NULL,
                "action" nvarchar(255) NOT NULL,
                "audit_date_time" datetimeoffset NOT NULL,
                "user_id" uniqueidentifier,
                CONSTRAINT "id_async_issuance_audit" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "async_issuance"
            ADD CONSTRAINT "fk_async_issuance_user_created_by_id" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "async_issuance"
            ADD CONSTRAINT "fk_async_issuance_user_updated_by_id" FOREIGN KEY ("updated_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "async_issuance"
            ADD CONSTRAINT "fk_async_issuance_contract_contract_id" FOREIGN KEY ("contract_id") REFERENCES "contract"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "async_issuance"
            ADD CONSTRAINT "fk_async_issuance_identity_identity_id" FOREIGN KEY ("identity_id") REFERENCES "identity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "async_issuance"
            ADD CONSTRAINT "fk_async_issuance_issuance_issuance_id" FOREIGN KEY ("issuance_id") REFERENCES "issuance"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "async_issuance_audit"
            ADD CONSTRAINT "fk_async_issuance_audit_user_user_id" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "async_issuance_audit" DROP CONSTRAINT "fk_async_issuance_audit_user_user_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "async_issuance" DROP CONSTRAINT "fk_async_issuance_issuance_issuance_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "async_issuance" DROP CONSTRAINT "fk_async_issuance_identity_identity_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "async_issuance" DROP CONSTRAINT "fk_async_issuance_contract_contract_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "async_issuance" DROP CONSTRAINT "fk_async_issuance_user_updated_by_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "async_issuance" DROP CONSTRAINT "fk_async_issuance_user_created_by_id"
        `);
        await queryRunner.query(`
            DROP TABLE "async_issuance_audit"
        `);
        await queryRunner.query(`
            DROP INDEX "ix_async_issuance_expires_on" ON "async_issuance"
        `);
        await queryRunner.query(`
            DROP TABLE "async_issuance"
        `);
    }

}
