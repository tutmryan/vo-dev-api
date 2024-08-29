import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCommunications1724318503217 implements MigrationInterface {
    name = 'AddCommunications1724318503217'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "communication" (
                "id" uniqueidentifier NOT NULL,
                "sent_at" datetimeoffset NOT NULL CONSTRAINT "DF_a877cccfe86f5bbf755817220a0" DEFAULT getdate(),
                "created_by_id" uniqueidentifier NOT NULL,
                "recipient_id" uniqueidentifier NOT NULL,
                "contact_method" nvarchar(255) NOT NULL,
                "purpose" nvarchar(255) NOT NULL,
                "async_issuance_id" uniqueidentifier,
                CONSTRAINT "id_communication" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "communication"
            ADD CONSTRAINT "fk_communication_user_created_by_id" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "communication"
            ADD CONSTRAINT "fk_communication_identity_recipient_id" FOREIGN KEY ("recipient_id") REFERENCES "identity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "communication"
            ADD CONSTRAINT "fk_communication_async_issuance_async_issuance_id" FOREIGN KEY ("async_issuance_id") REFERENCES "async_issuance"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "communication" DROP CONSTRAINT "fk_communication_async_issuance_async_issuance_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "communication" DROP CONSTRAINT "fk_communication_identity_recipient_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "communication" DROP CONSTRAINT "fk_communication_user_created_by_id"
        `);
        await queryRunner.query(`
            DROP TABLE "communication"
        `);
    }

}
