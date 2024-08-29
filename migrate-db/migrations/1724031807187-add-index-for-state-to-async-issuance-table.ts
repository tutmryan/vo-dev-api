import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIndexForStateToAsyncIssuanceTable1724031807187 implements MigrationInterface {
    name = 'AddIndexForStateToAsyncIssuanceTable1724031807187'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE INDEX "ix_async_issuance_state" ON "async_issuance" ("state")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "ix_async_issuance_state" ON "async_issuance"
        `);
    }

}
