import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveTemplateDescription1696579931648 implements MigrationInterface {
    name = 'RemoveTemplateDescription1696579931648'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "template" DROP COLUMN "description"
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "template"
            ADD "description" nvarchar(255) NOT NULL
        `);
    }

}
