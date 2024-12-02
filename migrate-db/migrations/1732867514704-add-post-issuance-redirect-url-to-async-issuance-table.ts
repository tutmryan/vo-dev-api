import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPostIssuanceRedirectUrlToAsyncIssuanceTable1732867514704 implements MigrationInterface {
    name = 'AddPostIssuanceRedirectUrlToAsyncIssuanceTable1732867514704'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "async_issuance"
            ADD "post_issuance_redirect_url" nvarchar(255)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "async_issuance" DROP COLUMN "post_issuance_redirect_url"
        `);
    }

}
