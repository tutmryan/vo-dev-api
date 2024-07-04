import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIssuanceHasFaceCheckPhoto1719975801163 implements MigrationInterface {
    name = 'AddIssuanceHasFaceCheckPhoto1719975801163'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "issuance"
            ADD "has_face_check_photo" bit
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "issuance" DROP COLUMN "has_face_check_photo"
        `);
    }

}
