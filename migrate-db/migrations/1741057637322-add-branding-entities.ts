import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBrandingEntities1741057637322 implements MigrationInterface {
    name = 'AddBrandingEntities1741057637322'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "branding" (
                "id" uniqueidentifier NOT NULL,
                "created_at" datetimeoffset NOT NULL CONSTRAINT "DF_ec33ba4739655b5f67c7e8956ca" DEFAULT getdate(),
                "updated_at" datetimeoffset CONSTRAINT "DF_cb3fb36de145286c0e00972316e" DEFAULT getdate(),
                "created_by_id" uniqueidentifier NOT NULL,
                "updated_by_id" uniqueidentifier,
                "name" nvarchar(255) NOT NULL,
                "data_json" nvarchar(MAX),
                CONSTRAINT "id_branding" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "branding_audit" (
                "id" uniqueidentifier NOT NULL,
                "entity_id" uniqueidentifier NOT NULL,
                "audit_data" nvarchar(MAX) NOT NULL,
                "action" nvarchar(255) NOT NULL,
                "audit_date_time" datetimeoffset NOT NULL,
                "user_id" uniqueidentifier,
                CONSTRAINT "id_branding_audit" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "branding"
            ADD CONSTRAINT "fk_branding_user_created_by_id" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "branding"
            ADD CONSTRAINT "fk_branding_user_updated_by_id" FOREIGN KEY ("updated_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "branding_audit"
            ADD CONSTRAINT "fk_branding_audit_user_user_id" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "branding_audit" DROP CONSTRAINT "fk_branding_audit_user_user_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "branding" DROP CONSTRAINT "fk_branding_user_updated_by_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "branding" DROP CONSTRAINT "fk_branding_user_created_by_id"
        `);
        await queryRunner.query(`
            DROP TABLE "branding_audit"
        `);
        await queryRunner.query(`
            DROP TABLE "branding"
        `);
    }

}
