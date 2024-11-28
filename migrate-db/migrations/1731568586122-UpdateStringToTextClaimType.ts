import { MigrationInterface, QueryRunner } from 'typeorm'

export class UpdateStringToTextClaimType1731568586122 implements MigrationInterface {
  name = 'UpdateStringToTextClaimType1731568586122'
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE contract
      SET display_json = REPLACE(display_json, '"type":"string"', '"type":"text"')
      WHERE display_json LIKE '%"type":"string"%';
    `)

    await queryRunner.query(`
      UPDATE template
      SET display_json = REPLACE(display_json, '"type":"string"', '"type":"text"')
      WHERE display_json LIKE '%"type":"string"%';
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE contract
      SET display_json = REPLACE(display_json, '"type":"text"', '"type":"string"')
      WHERE display_json LIKE '%"type":"text"%';
    `)

    await queryRunner.query(`
      UPDATE template
      SET display_json = REPLACE(display_json, '"type":"text"', '"type":"string"')
      WHERE display_json LIKE '%"type":"text"%';
    `)
  }
}
