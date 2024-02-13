import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCredentialTypesToTemplate1682069478079 implements MigrationInterface {
    name = 'AddCredentialTypesToTemplate1682069478079'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "template"
            ADD "credential_types_json" nvarchar(MAX)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "template" DROP COLUMN "credential_types_json"
        `);
    }

}
