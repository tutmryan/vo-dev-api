import { MigrationInterface, QueryRunner } from "typeorm";

export class useJsonTemplateDisplay1679540230564 implements MigrationInterface {
    name = 'useJsonTemplateDisplay1679540230564'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "template"
            ADD "display_json" nvarchar(MAX)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "template" DROP COLUMN "display_json"
        `);
    }

}
