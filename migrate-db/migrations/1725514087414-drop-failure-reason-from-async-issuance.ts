import { MigrationInterface, QueryRunner } from "typeorm";

export class DropFailureReasonFromAsyncIssuance1725514087414 implements MigrationInterface {
    name = 'DropFailureReasonFromAsyncIssuance1725514087414'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "async_issuance" DROP COLUMN "failure_reason"
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "async_issuance"
            ADD "failure_reason" nvarchar(MAX)
        `);
    }

}
