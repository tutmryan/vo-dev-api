import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRequestIdToIssuancePresentation1691562226888 implements MigrationInterface {
    name = 'AddRequestIdToIssuancePresentation1691562226888'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "issuance"
            ADD "request_id" nvarchar(255)
        `);
        await queryRunner.query(`
            ALTER TABLE "presentation"
            ADD "request_id" nvarchar(255)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "presentation" DROP COLUMN "request_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "issuance" DROP COLUMN "request_id"
        `);
    }

}
