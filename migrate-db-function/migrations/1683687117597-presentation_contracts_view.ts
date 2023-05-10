import { MigrationInterface, QueryRunner } from 'typeorm'

export class PresentationContractsView1683687117597 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        CREATE VIEW presentation_contracts_view AS
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
            u.id          as presented_by_id,
            u.name        as presented_by_name,
            u.email       as presented_by_email,
            u.is_app      as presented_by_is_app,
            id.id         as presented_to_id,
            id.identifier as presented_to_identifier,
            id.name       as presented_to_name,
            id.issuer     as presented_to_issuer
          from presentation_contracts pc
            inner join contract c on c.id = pc.contract_id
            inner join presentation p on p.id = pc.presentation_id
            inner join [user] u on u.id = p.user_id
            left join [identity] id on id.id = p.identity_id
            left join template t on t.id = c.template_id
      `)

    await queryRunner.query(`
      GRANT SELECT ON presentation_contracts_view TO report_data_viewer
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP VIEW presentation_contracts_view
    `)
  }
}
