import type { MigrationInterface, QueryRunner } from 'typeorm'

export class ContractView1683615567083 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        CREATE VIEW contract_view AS
          select c.id,
            c.name,
            c.description,
            t.id                                                                         as template_id,
            t.name                                                                       as template_name,
            t.description                                                                as template_description,
            c.is_public,
            c.validity_interval_in_seconds / 86400                                       as validity_interval_in_days,
            c.credential_types_json,
            c.display_json,
            c.created_at,
            cu.id                                                                        as created_by_id,
            cu.name                                                                      as created_by_name,
            cu.email                                                                     as created_by_email,
            c.updated_at,
            ubu.id                                                                       as updated_by_id,
            ubu.name                                                                     as updated_by_name,
            ubu.email                                                                    as updated_by_email,
            c.external_id                                                                as provisioned_contract_id,
            c.provisioned_at,
            pu.id                                                                        as provisioned_by_id,
            pu.name                                                                      as provisioned_by_name,
            pu.email                                                                     as provisioned_by_email,
            c.last_provisioned_at,
            lpu.id                                                                       as last_provisioned_by_id,
            lpu.name                                                                     as last_provisioned_by_name,
            lpu.email                                                                    as last_provisioned_by_email,
            (SELECT COUNT(*) FROM issuance i where i.contract_id = c.id)                 as issuance_count,
            (SELECT COUNT(*) FROM presentation_contracts pc where pc.contract_id = c.id) as presentation_count
          from contract c
            left join template t on c.template_id = t.id
            left join [user] cu on c.created_by_id = cu.id
            left join [user] ubu on c.updated_by_id = ubu.id
            left join [user] pu on c.provisioned_by_id = pu.id
            left join [user] lpu on c.last_provisioned_by_id = lpu.id
      `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP VIEW contract_view
    `)
  }
}
