import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPresentationReceipt1751269265910 implements MigrationInterface {
    name = 'AddPresentationReceipt1751269265910'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "presentation"
            ADD "receipt_json" nvarchar(MAX)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "presentation" DROP COLUMN "receipt_json"
        `);
    }

}
