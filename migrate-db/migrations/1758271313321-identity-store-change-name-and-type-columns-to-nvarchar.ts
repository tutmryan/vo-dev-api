import { MigrationInterface, QueryRunner } from "typeorm";

export class IdentityStoreChangeNameAndTypeColumnsToNvarchar1758271313321 implements MigrationInterface {
    name = 'IdentityStoreChangeNameAndTypeColumnsToNvarchar1758271313321'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "identity_store"
            ALTER COLUMN "name" nvarchar(255) NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "identity_store"
            ALTER COLUMN "type" nvarchar(50) NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "application_label_config"
            ALTER COLUMN "name" nvarchar(255) NOT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "application_label_config"
            ALTER COLUMN "name" varchar(255) NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "identity_store"
            ALTER COLUMN "type" varchar(50) NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "identity_store"
            ALTER COLUMN "name" varchar(255) NOT NULL
        `);
    }

}
