import type { MigrationInterface, QueryRunner } from 'typeorm'

export class CommunicationStatusDetails1765339995993 implements MigrationInterface {
  name = 'CommunicationStatusDetails1765339995993'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add the details column
    await queryRunner.query(`
            ALTER TABLE "communication"
            ADD "details" nvarchar(255)
        `)

    // Initial addition of status column allowing null
    await queryRunner.query(`
            ALTER TABLE "communication"
            ADD "status" nvarchar(255) NULL
        `)

    // Migrate existing data from error column to status and details
    await queryRunner.query(`
            UPDATE "communication"
            SET
                "status" = CASE
                    WHEN "error" IS NULL THEN 'sent'
                    ELSE 'failed'
                END,
                "details" = "error"
        `)

    // Alter status column to be NOT NULL
    await queryRunner.query(`
            ALTER TABLE "communication"
            ALTER COLUMN "status" nvarchar(255) NOT NULL
        `)

    // Drop the old error column
    await queryRunner.query(`
            ALTER TABLE "communication" DROP COLUMN "error"
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Add the error column back
    await queryRunner.query(`
            ALTER TABLE "communication"
            ADD "error" nvarchar(255)
        `)

    // Migrate data back from status/details to error
    await queryRunner.query(`
            UPDATE "communication"
            SET "error" = CASE
                WHEN "status" = 'failed' THEN "details"
                ELSE NULL
            END
        `)

    // Drop the status column
    await queryRunner.query(`
            ALTER TABLE "communication" DROP COLUMN "status"
        `)

    // Drop the details column
    await queryRunner.query(`
            ALTER TABLE "communication" DROP COLUMN "details"
        `)
  }
}
