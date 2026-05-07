import type { MigrationInterface, QueryRunner } from 'typeorm'

export class AddPresentationFlowRequestTracking1771930310058 implements MigrationInterface {
  name = 'AddPresentationFlowRequestTracking1771930310058'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "presentation_flow" ADD "is_request_created" bit`)
    await queryRunner.query(`ALTER TABLE "presentation_flow" ADD "is_request_retrieved" bit`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "presentation_flow" DROP COLUMN "is_request_retrieved"`)
    await queryRunner.query(`ALTER TABLE "presentation_flow" DROP COLUMN "is_request_created"`)
  }
}
