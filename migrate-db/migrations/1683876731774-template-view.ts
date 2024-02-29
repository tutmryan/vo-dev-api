import { MigrationInterface, QueryRunner } from 'typeorm'

export class TemplateView1683876731774 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE VIEW template_view AS
        select t.id,
          t.name,
          t.description,
          t.id                                                         as template_id,
          t.name                                                       as template_name,
          t.description                                                as template_description,
          t.is_public,
          t.validity_interval_in_seconds / 86400                       as validity_interval_in_days,
          t.credential_types_json,
          t.display_json,
          t.created_at,
          cu.id                                                        as created_by_id,
          cu.name                                                      as created_by_name,
          cu.email                                                     as created_by_email,
          t.updated_at,
          ubu.id                                                       as updated_by_id,
          ubu.name                                                     as updated_by_name,
          ubu.email                                                    as updated_by_email,
          pt.id                                                        as parent_template_id,
          pt.name                                                      as parent_template_name,
          pt.description                                               as parent_template_description,
          (SELECT COUNT(*) FROM contract c where t.parent_id = t.id)   as contract_count,
          (SELECT COUNT(*) FROM template ct where ct.parent_id = t.id) as child_template_count
        from template t
          inner join [user] cu on t.created_by_id = cu.id
          left join [user] ubu on t.updated_by_id = ubu.id
          left join template pt on t.parent_id = pt.id
      `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP VIEW template_view
    `)
  }
}
