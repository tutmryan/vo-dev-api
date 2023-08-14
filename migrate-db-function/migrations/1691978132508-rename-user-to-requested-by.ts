import { MigrationInterface, QueryRunner } from 'typeorm'

export class RenameUserToRequestedBy1691978132508 implements MigrationInterface {
  name = 'RenameUserToRequestedBy1691978132508'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "presentation" DROP CONSTRAINT "fk_presentation_user_user_id"
        `)
    await queryRunner.query(`
            EXEC sp_rename "dbo.presentation.user_id",
            "requested_by_id"
        `)
    await queryRunner.query(`
            ALTER TABLE "presentation"
            ALTER COLUMN "requested_by_id" uniqueidentifier
        `)
    await queryRunner.query(`
            ALTER TABLE "presentation"
            ADD CONSTRAINT "fk_presentation_user_requested_by_id" FOREIGN KEY ("requested_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
        ALTER VIEW [dbo].[presentation_view] AS
        select p.id,
          p.presented_at,
          p.requested_credentials_json,
          p.presented_credentials_json,
          ru.id         as requested_by_id,
          ru.name       as requested_by_name,
          ru.email      as requested_by_email,
          ru.is_app     as requested_by_is_app,
          id.id         as presented_by_id,
          id.identifier as presented_by_identifier,
          id.name       as presented_by_name,
          id.issuer     as presented_by_issuer
        from presentation p
          inner join [user] ru on ru.id = p.requested_by_id
          left join [identity] id on id.id = p.identity_id
        `)
    await queryRunner.query(`
        ALTER VIEW [dbo].[presentation_contracts_view] AS
        select p.id,
          p.presented_at,
          p.requested_credentials_json,
          p.presented_credentials_json,
          c.id          as contract_id,
          c.name        as contract_name,
          c.description as contract_description,
          c.credential_types_json,
          c.is_public   as contract_is_public,
          c.template_id,
          t.name        as template_name,
          ru.id         as requested_by_id,
          ru.name       as requested_by_name,
          ru.email      as requested_by_email,
          ru.is_app     as requested_by_is_app,
          id.id         as presented_by_id,
          id.identifier as presented_by_identifier,
          id.name       as presented_by_name,
          id.issuer     as presented_by_issuer
        from presentation_issuances pi
          inner join issuance i on i.id = pi.issuance_id
          inner join contract c on c.id = i.contract_id
          inner join presentation p on p.id = pi.presentation_id
          inner join [user] ru on ru.id = p.requested_by_id
          left join [identity] id on id.id = p.identity_id
          left join template t on t.id = c.template_id
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "presentation" DROP CONSTRAINT "fk_presentation_user_requested_by_id"
        `)
    await queryRunner.query(`
            ALTER TABLE "presentation"
            ALTER COLUMN "requested_by_id" uniqueidentifier NOT NULL
        `)
    await queryRunner.query(`
            EXEC sp_rename "dbo.presentation.requested_by_id",
            "user_id"
        `)
    await queryRunner.query(`
            ALTER TABLE "presentation"
            ADD CONSTRAINT "fk_presentation_user_user_id" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
  }
}
