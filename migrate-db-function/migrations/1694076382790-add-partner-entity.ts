import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPartnerEntity1694076382790 implements MigrationInterface {
    name = 'AddPartnerEntity1694076382790'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "partner" (
                "id" uniqueidentifier NOT NULL,
                "name" nvarchar(255) NOT NULL,
                "did" nvarchar(MAX) NOT NULL,
                "credential_types_json" nvarchar(MAX) NOT NULL,
                "tenant_id" uniqueidentifier,
                "issuer_id" uniqueidentifier,
                "linked_domain_urls_json" nvarchar(MAX),
                CONSTRAINT "id_partner" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "issuance" DROP CONSTRAINT "fk_issuance_user_issued_by_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "issuance"
            ALTER COLUMN "issued_by_id" uniqueidentifier NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "issuance"
            ALTER COLUMN "expires_at" datetimeoffset NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "presentation" DROP CONSTRAINT "fk_presentation_user_requested_by_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "presentation"
            ALTER COLUMN "requested_by_id" uniqueidentifier NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "issuance"
            ADD CONSTRAINT "fk_issuance_user_issued_by_id" FOREIGN KEY ("issued_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "presentation"
            ADD CONSTRAINT "fk_presentation_user_requested_by_id" FOREIGN KEY ("requested_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "presentation" DROP CONSTRAINT "fk_presentation_user_requested_by_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "issuance" DROP CONSTRAINT "fk_issuance_user_issued_by_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "presentation"
            ALTER COLUMN "requested_by_id" uniqueidentifier
        `);
        await queryRunner.query(`
            ALTER TABLE "presentation"
            ADD CONSTRAINT "fk_presentation_user_requested_by_id" FOREIGN KEY ("requested_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "issuance"
            ALTER COLUMN "expires_at" datetimeoffset
        `);
        await queryRunner.query(`
            ALTER TABLE "issuance"
            ALTER COLUMN "issued_by_id" uniqueidentifier
        `);
        await queryRunner.query(`
            ALTER TABLE "issuance"
            ADD CONSTRAINT "fk_issuance_user_issued_by_id" FOREIGN KEY ("issued_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            DROP TABLE "partner"
        `);
    }

}
