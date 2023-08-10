import { MigrationInterface, QueryRunner } from 'typeorm'

export class RenameUserToIssuedBy1691638556871 implements MigrationInterface {
  name = 'RenameUserToIssuedBy1691638556871'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "issuance" DROP CONSTRAINT "fk_issuance_user_user_id"
        `)
    await queryRunner.query(`
            EXEC sp_rename "dbo.issuance.user_id",
            "issued_by_id"
        `)
    await queryRunner.query(`
            ALTER TABLE "issuance"
            ALTER COLUMN "issued_by_id" uniqueidentifier
        `)
    await queryRunner.query(`
            ALTER TABLE "issuance"
            ADD CONSTRAINT "fk_issuance_user_issued_by_id" FOREIGN KEY ("issued_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
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
              inner join [user] u on u.id = i.issued_by_id
              inner join [identity] id on id.id = i.identity_id
              left join template t on t.id = c.template_id
              left join [user] ru on ru.id = i.revoked_by_id
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "issuance" DROP CONSTRAINT "fk_issuance_user_issued_by_id"
        `)
    await queryRunner.query(`
            ALTER TABLE "issuance"
            ALTER COLUMN "issued_by_id" uniqueidentifier NOT NULL
        `)
    await queryRunner.query(`
            EXEC sp_rename "dbo.issuance.issued_by_id",
            "user_id"
        `)
    await queryRunner.query(`
            ALTER TABLE "issuance"
            ADD CONSTRAINT "fk_issuance_user_user_id" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
  }
}
