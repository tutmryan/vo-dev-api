import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIscancelledToApprovalRequests1724901799519 implements MigrationInterface {
    name = 'AddIscancelledToApprovalRequests1724901799519'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "approval_request"
            ADD "is_cancelled" bit
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "approval_request" DROP COLUMN "is_cancelled"
        `);
    }

}
