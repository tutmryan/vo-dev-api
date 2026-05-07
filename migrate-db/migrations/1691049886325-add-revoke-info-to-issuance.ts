import type { MigrationInterface, QueryRunner } from 'typeorm'

export class AddRevokeInfoToIssuance1691049886325 implements MigrationInterface {
  name = 'AddRevokeInfoToIssuance1691049886325'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "issuance"
            ADD "is_revoked" bit
        `)
    await queryRunner.query(`
            ALTER TABLE "issuance"
            ADD "revoked_at" datetimeoffset
        `)
    await queryRunner.query(`
            ALTER TABLE "issuance"
            ADD "revoked_by_id" uniqueidentifier
        `)
    await queryRunner.query(`
            ALTER TABLE "issuance"
            ADD CONSTRAINT "fk_issuance_user_revoked_by_id" FOREIGN KEY ("revoked_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
        ALTER VIEW [dbo].[issuance_view] AS
          select i.id,
            i.issued_at,
            i.is_revoked,
            i.revoked_at,
            c.id           as contract_id,
            c.name         as contract_name,
            c.description  as contract_description,
            c.credential_types_json,
            c.is_public    as contract_is_public,
            c.template_id,
            t.name         as template_name,
            u.id           as issued_by_id,
            u.name         as issued_by_name,
            u.email        as issued_by_email,
            u.is_app       as issued_by_is_app,
            id.id          as issued_to_id,
            id.identifier  as issued_to_identifier,
            id.name        as issued_to_name,
            id.issuer      as issued_to_issuer,
            ru.id          as revoked_by_id,
            ru.name        as revoked_by_name,
            ru.email       as revoked_by_email,
            ru.is_app      as revoked_by_is_app
          from issuance i
            inner join contract c on c.id = i.contract_id
            inner join [user] u on u.id = i.user_id
            inner join [identity] id on id.id = i.identity_id
            left join template t on t.id = c.template_id
            left join [user] ru on ru.id = i.revoked_by_id
      `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
