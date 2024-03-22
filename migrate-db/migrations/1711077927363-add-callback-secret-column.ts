import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCallbackSecretColumn1711077927363 implements MigrationInterface {
  name = 'AddCallbackSecretColumn1711077927363'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "approval_request"
            ADD "callback_secret" uniqueidentifier
        `);
    await queryRunner.query(`
            UPDATE [dbo].[approval_request]
            SET
                [approval_request].[callback_secret] = NEWID()
            WHERE [approval_request].[callback_secret] IS NULL
        `)

    await queryRunner.query(`
            ALTER TABLE "approval_request"
            ALTER COLUMN "callback_secret" uniqueidentifier NOT NULL
        `)

  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "approval_request" DROP COLUMN "callback_secret"
        `);
  }

}
