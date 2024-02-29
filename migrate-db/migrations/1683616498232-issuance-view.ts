import { MigrationInterface, QueryRunner } from 'typeorm'

export class IssuanceView1683616498232 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        CREATE VIEW issuance_view AS
          select i.id,
            i.issued_at,
            c.id          as contract_id,
            c.name        as contract_name,
            c.description as contract_description,
            c.credential_types_json,
            c.is_public   as contract_is_public,
            c.template_id,
            t.name as template_name,
            u.id          as issued_by_id,
            u.name        as issued_by_name,
            u.email       as issued_by_email,
            u.is_app      as issued_by_is_app,
            id.id         as issued_to_id,
            id.identifier as issued_to_identifier,
            id.name       as issued_to_name,
            id.issuer     as issued_to_issuer
          from issuance i
            inner join contract c on c.id = i.contract_id
            inner join [user] u on u.id = i.user_id
            inner join [identity] id on id.id = i.identity_id
            left join template t on t.id = c.template_id
      `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP VIEW issuance_view
    `)
  }
}
