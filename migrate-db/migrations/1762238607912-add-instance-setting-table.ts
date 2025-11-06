import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInstanceSettingTable1762238607912 implements MigrationInterface {
    name = 'AddInstanceSettingTable1762238607912'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "instance_settings" (
                "id" uniqueidentifier NOT NULL,
                "setting_key" nvarchar(100) NOT NULL,
                "setting_value" nvarchar(max) NOT NULL,
                CONSTRAINT "id_instance_settings" PRIMARY KEY ("id", "setting_key")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE "instance_settings"
        `);
    }

}
