import type { MigrationInterface, QueryRunner } from 'typeorm'

export class AddCommunicationsSentIndex1724396644982 implements MigrationInterface {
  name = 'AddCommunicationsSentIndex1724396644982'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE INDEX "ix_communication_sent_at" ON "communication" ("sent_at")
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX "ix_communication_sent_at" ON "communication"
        `)
  }
}
