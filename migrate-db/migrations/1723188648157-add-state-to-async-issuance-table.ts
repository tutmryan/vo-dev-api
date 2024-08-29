import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStateToAsyncIssuanceTable1723188648157 implements MigrationInterface {
    name = 'AddStateToAsyncIssuanceTable1723188648157'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "async_issuance"
            ADD "state" nvarchar(255) NOT NULL CONSTRAINT "DF_3084458c99869a61f4a847e1aef" DEFAULT 'pending'
        `);
        await queryRunner.query(`
            ALTER TABLE "async_issuance"
            ADD "failure_reason" nvarchar(MAX)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "async_issuance" DROP COLUMN "failure_reason"
        `);
        await queryRunner.query(`
            ALTER TABLE "async_issuance" DROP CONSTRAINT "DF_3084458c99869a61f4a847e1aef"
        `);
        await queryRunner.query(`
            ALTER TABLE "async_issuance" DROP COLUMN "state"
        `);
    }

}
