import { MigrationInterface, QueryRunner } from "typeorm";

export class OidcClientRequireFaceCheck1732181399322 implements MigrationInterface {
    name = 'OidcClientRequireFaceCheck1732181399322'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "oidc_client"
            ADD "require_face_check" bit NOT NULL CONSTRAINT "DF_afb1bd130414750cb1a206d5228" DEFAULT 0
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "oidc_client" DROP CONSTRAINT "DF_afb1bd130414750cb1a206d5228"
        `);
        await queryRunner.query(`
            ALTER TABLE "oidc_client" DROP COLUMN "require_face_check"
        `);
    }

}
