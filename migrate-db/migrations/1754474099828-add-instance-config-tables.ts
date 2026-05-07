import type { MigrationInterface, QueryRunner } from 'typeorm'

export class AddInstanceConfigTables1754474099828 implements MigrationInterface {
  name = 'AddInstanceConfigTables1754474099828'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "cors_origin_config" (
                "id" uniqueidentifier NOT NULL,
                "origin" varchar(255) NOT NULL,
                CONSTRAINT "uq_cors_origin_config_origin" UNIQUE ("origin"),
                CONSTRAINT "id_cors_origin_config" PRIMARY KEY ("id")
            )
        `)
    await queryRunner.query(`
            CREATE TABLE "application_label_config" (
                "id" uniqueidentifier NOT NULL,
                "identifier" varchar(255) NOT NULL,
                "name" varchar(255) NOT NULL,
                CONSTRAINT "uq_application_label_config_identifier" UNIQUE ("identifier"),
                CONSTRAINT "id_application_label_config" PRIMARY KEY ("id")
            )
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP TABLE "application_label_config"
        `)
    await queryRunner.query(`
            DROP TABLE "cors_origin_config"
        `)
  }
}
