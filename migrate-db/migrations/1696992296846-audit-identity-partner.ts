import type { MigrationInterface, QueryRunner } from 'typeorm'

export class AuditIdentityPartner1696992296846 implements MigrationInterface {
  name = 'AuditIdentityPartner1696992296846'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "partner_audit" (
                "id" uniqueidentifier NOT NULL,
                "entity_id" uniqueidentifier NOT NULL,
                "audit_data" nvarchar(MAX) NOT NULL,
                "action" nvarchar(255) NOT NULL,
                "audit_date_time" datetimeoffset NOT NULL,
                "user_id" uniqueidentifier,
                CONSTRAINT "id_partner_audit" PRIMARY KEY ("id")
            )
        `)
    await queryRunner.query(`
            CREATE TABLE "identity_audit" (
                "id" uniqueidentifier NOT NULL,
                "entity_id" uniqueidentifier NOT NULL,
                "audit_data" nvarchar(MAX) NOT NULL,
                "action" nvarchar(255) NOT NULL,
                "audit_date_time" datetimeoffset NOT NULL,
                "user_id" uniqueidentifier,
                CONSTRAINT "id_identity_audit" PRIMARY KEY ("id")
            )
        `)
    await queryRunner.query(`
            ALTER TABLE "identity"
            ADD "created_at" datetimeoffset NOT NULL CONSTRAINT "DF_eda2ef8b1da50af259877271dbf" DEFAULT getdate()
        `)
    await queryRunner.query(`
            ALTER TABLE "identity"
            ADD "updated_at" datetimeoffset CONSTRAINT "DF_e2f786ba7b107a640bcc2757224" DEFAULT getdate()
        `)
    await queryRunner.query(`
            ALTER TABLE "identity"
            ADD "created_by_id" uniqueidentifier
        `)
    await queryRunner.query(`
            ALTER TABLE "identity"
            ADD "updated_by_id" uniqueidentifier
        `)
    await queryRunner.query(`
            ALTER TABLE "partner"
            ADD "created_at" datetimeoffset NOT NULL CONSTRAINT "DF_192d072f322b9ad0883b5c0dbf2" DEFAULT getdate()
        `)
    await queryRunner.query(`
            ALTER TABLE "partner"
            ADD "updated_at" datetimeoffset CONSTRAINT "DF_7a8762f26a23a4ef91a566888be" DEFAULT getdate()
        `)
    await queryRunner.query(`
            ALTER TABLE "partner"
            ADD "created_by_id" uniqueidentifier
        `)
    await queryRunner.query(`
            ALTER TABLE "partner"
            ADD "updated_by_id" uniqueidentifier
        `)
    await queryRunner.query(`
            ALTER TABLE "identity"
            ADD CONSTRAINT "fk_identity_user_created_by_id" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
            ALTER TABLE "identity"
            ADD CONSTRAINT "fk_identity_user_updated_by_id" FOREIGN KEY ("updated_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
            ALTER TABLE "partner_audit"
            ADD CONSTRAINT "fk_partner_audit_user_user_id" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
            ALTER TABLE "identity_audit"
            ADD CONSTRAINT "fk_identity_audit_user_user_id" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
            ALTER TABLE "partner"
            ADD CONSTRAINT "fk_partner_user_created_by_id" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
            ALTER TABLE "partner"
            ADD CONSTRAINT "fk_partner_user_updated_by_id" FOREIGN KEY ("updated_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "partner" DROP CONSTRAINT "fk_partner_user_updated_by_id"
        `)
    await queryRunner.query(`
            ALTER TABLE "partner" DROP CONSTRAINT "fk_partner_user_created_by_id"
        `)
    await queryRunner.query(`
            ALTER TABLE "identity_audit" DROP CONSTRAINT "fk_identity_audit_user_user_id"
        `)
    await queryRunner.query(`
            ALTER TABLE "partner_audit" DROP CONSTRAINT "fk_partner_audit_user_user_id"
        `)
    await queryRunner.query(`
            ALTER TABLE "identity" DROP CONSTRAINT "fk_identity_user_updated_by_id"
        `)
    await queryRunner.query(`
            ALTER TABLE "identity" DROP CONSTRAINT "fk_identity_user_created_by_id"
        `)
    await queryRunner.query(`
            ALTER TABLE "partner" DROP COLUMN "updated_by_id"
        `)
    await queryRunner.query(`
            ALTER TABLE "partner" DROP COLUMN "created_by_id"
        `)
    await queryRunner.query(`
            ALTER TABLE "partner" DROP CONSTRAINT "DF_7a8762f26a23a4ef91a566888be"
        `)
    await queryRunner.query(`
            ALTER TABLE "partner" DROP COLUMN "updated_at"
        `)
    await queryRunner.query(`
            ALTER TABLE "partner" DROP CONSTRAINT "DF_192d072f322b9ad0883b5c0dbf2"
        `)
    await queryRunner.query(`
            ALTER TABLE "partner" DROP COLUMN "created_at"
        `)
    await queryRunner.query(`
            ALTER TABLE "identity" DROP COLUMN "updated_by_id"
        `)
    await queryRunner.query(`
            ALTER TABLE "identity" DROP COLUMN "created_by_id"
        `)
    await queryRunner.query(`
            ALTER TABLE "identity" DROP CONSTRAINT "DF_e2f786ba7b107a640bcc2757224"
        `)
    await queryRunner.query(`
            ALTER TABLE "identity" DROP COLUMN "updated_at"
        `)
    await queryRunner.query(`
            ALTER TABLE "identity" DROP CONSTRAINT "DF_eda2ef8b1da50af259877271dbf"
        `)
    await queryRunner.query(`
            ALTER TABLE "identity" DROP COLUMN "created_at"
        `)
    await queryRunner.query(`
            DROP TABLE "identity_audit"
        `)
    await queryRunner.query(`
            DROP TABLE "partner_audit"
        `)
  }
}
