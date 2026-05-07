import type { MigrationInterface, QueryRunner } from 'typeorm'

export class AddOidcPolicyAuthParamsAndResponseTypes1776323872565 implements MigrationInterface {
  name = 'AddOidcPolicyAuthParamsAndResponseTypes1776323872565'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // response_types_json
    const hasResponseTypes = await queryRunner.query(`
      SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'oidc_client' AND COLUMN_NAME = 'response_types_json'
    `)
    if (hasResponseTypes.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "oidc_client"
        ADD "response_types_json" nvarchar(MAX) NULL
      `)
      await queryRunner.query(`
        UPDATE "oidc_client"
        SET "response_types_json" = '["CODE"]'
        WHERE "response_types_json" IS NULL
      `)
      await queryRunner.query(`
        ALTER TABLE "oidc_client"
        ALTER COLUMN "response_types_json" nvarchar(MAX) NOT NULL
      `)
    }

    // vc_policy_json
    const hasVcPolicy = await queryRunner.query(`
      SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'oidc_client' AND COLUMN_NAME = 'vc_policy_json'
    `)
    if (hasVcPolicy.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "oidc_client"
        ADD "vc_policy_json" nvarchar(MAX)
      `)
    }

    // constraint_json
    const hasConstraint = await queryRunner.query(`
      SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'oidc_client' AND COLUMN_NAME = 'constraint_json'
    `)
    if (hasConstraint.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "oidc_client"
        ADD "constraint_json" nvarchar(MAX)
      `)
    }

    // face_check_confidence_threshold
    const hasFaceCheck = await queryRunner.query(`
      SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'oidc_client' AND COLUMN_NAME = 'face_check_confidence_threshold'
    `)
    if (hasFaceCheck.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "oidc_client"
        ADD "face_check_confidence_threshold" int
      `)
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasFaceCheck = await queryRunner.query(`
      SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'oidc_client' AND COLUMN_NAME = 'face_check_confidence_threshold'
    `)
    if (hasFaceCheck.length > 0) {
      await queryRunner.query(`ALTER TABLE "oidc_client" DROP COLUMN "face_check_confidence_threshold"`)
    }

    const hasConstraint = await queryRunner.query(`
      SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'oidc_client' AND COLUMN_NAME = 'constraint_json'
    `)
    if (hasConstraint.length > 0) {
      await queryRunner.query(`ALTER TABLE "oidc_client" DROP COLUMN "constraint_json"`)
    }

    const hasVcPolicy = await queryRunner.query(`
      SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'oidc_client' AND COLUMN_NAME = 'vc_policy_json'
    `)
    if (hasVcPolicy.length > 0) {
      await queryRunner.query(`ALTER TABLE "oidc_client" DROP COLUMN "vc_policy_json"`)
    }

    const hasResponseTypes = await queryRunner.query(`
      SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'oidc_client' AND COLUMN_NAME = 'response_types_json'
    `)
    if (hasResponseTypes.length > 0) {
      await queryRunner.query(`ALTER TABLE "oidc_client" DROP COLUMN "response_types_json"`)
    }
  }
}
