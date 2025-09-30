import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIdentityStoreTable1754410972843 implements MigrationInterface {
    name = 'AddIdentityStoreTable1754410972843'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "identity_store" (
                "id" uniqueidentifier NOT NULL,
                "created_at" datetimeoffset NOT NULL CONSTRAINT "DF_1535742d68c32753178eb092a42" DEFAULT getdate(),
                "updated_at" datetimeoffset CONSTRAINT "DF_a63d570f5facc0387a902d4be8a" DEFAULT getdate(),
                "created_by_id" uniqueidentifier NOT NULL,
                "updated_by_id" uniqueidentifier,
                "deleted_at" datetimeoffset,
                "identifier" varchar(255) NOT NULL,
                "name" varchar(255) NOT NULL,
                "type" varchar(50) NOT NULL,
                "is_authentication_enabled" bit NOT NULL,
                "client_id" varchar(255),
                CONSTRAINT "uq_identity_store_identifier" UNIQUE ("identifier"),
                CONSTRAINT "id_identity_store" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "identity_store_audit" (
                "id" uniqueidentifier NOT NULL,
                "entity_id" uniqueidentifier NOT NULL,
                "audit_data" nvarchar(MAX) NOT NULL,
                "action" nvarchar(255) NOT NULL,
                "audit_date_time" datetimeoffset NOT NULL,
                "user_id" uniqueidentifier,
                CONSTRAINT "id_identity_store_audit" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "identity_store"
            ADD CONSTRAINT "fk_identity_store_user_created_by_id" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "identity_store"
            ADD CONSTRAINT "fk_identity_store_user_updated_by_id" FOREIGN KEY ("updated_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "identity_store_audit"
            ADD CONSTRAINT "fk_identity_store_audit_user_user_id" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "identity_store_audit" DROP CONSTRAINT "fk_identity_store_audit_user_user_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "identity_store" DROP CONSTRAINT "fk_identity_store_user_updated_by_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "identity_store" DROP CONSTRAINT "fk_identity_store_user_created_by_id"
        `);
        await queryRunner.query(`
            DROP TABLE "identity_store_audit"
        `);
        await queryRunner.query(`
            DROP TABLE "identity_store"
        `);
    }

}
