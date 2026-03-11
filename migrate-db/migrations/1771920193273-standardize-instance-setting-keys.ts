import { MigrationInterface, QueryRunner } from 'typeorm'

export class StandardizeInstanceSettingKeys1771920193273 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE instance_settings
      SET setting_key = 'emailSender'
      WHERE setting_key = 'email-sender'
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE instance_settings
      SET setting_key = 'email-sender'
      WHERE setting_key = 'emailSender'
    `)
  }
}
