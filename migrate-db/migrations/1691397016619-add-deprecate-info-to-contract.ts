import type { MigrationInterface, QueryRunner } from 'typeorm'

export class AddDeprecateInfoToContract1691397016619 implements MigrationInterface {
  name = 'AddDeprecateInfoToContract1691397016619'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "contract"
            ADD "is_deprecated" bit
        `)
    await queryRunner.query(`
            ALTER TABLE "contract"
            ADD "deprecated_at" datetimeoffset
        `)
    await queryRunner.query(`
            ALTER TABLE "contract"
            ADD "deprecated_by_id" uniqueidentifier
        `)
    await queryRunner.query(`
            ALTER TABLE "contract"
            ADD CONSTRAINT "fk_contract_user_deprecated_by_id" FOREIGN KEY ("deprecated_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
          ALTER VIEW [dbo].[contract_view] AS
            select
              c.id,
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
              c.is_deprecated,
              c.deprecated_at,
              du.id                                                                        as deprecated_by_id,
              du.name                                                                      as deprecated_by_name,
              du.email                                                                     as deprecated_by_email,
              COUNT(DISTINCT i.id)                                                         as issuance_count,
              COUNT(DISTINCT pi.presentation_id)                                           as presentation_count
            from contract c
              left join template t on c.template_id = t.id
              left join [user] cu on c.created_by_id = cu.id
              left join [user] ubu on c.updated_by_id = ubu.id
              left join [user] pu on c.provisioned_by_id = pu.id
              left join [user] lpu on c.last_provisioned_by_id = lpu.id
              left join [user] du on c.deprecated_by_id = du.id
              left join [issuance] i on c.id = i.contract_id
              left join [presentation_issuances] pi on i.id = pi.issuance_id
            group by
              c.id,
              c.name,
              c.description,
              t.id,
              t.name,
              t.description,
              c.is_public,
              c.validity_interval_in_seconds / 86400,
              c.credential_types_json,
              c.display_json,
              c.created_at,
              cu.id,
              cu.name,
              cu.email,
              c.updated_at,
              ubu.id,
              ubu.name,
              ubu.email,
              c.external_id,
              c.provisioned_at,
              pu.id,
              pu.name,
              pu.email,
              c.last_provisioned_at,
              lpu.id,
              lpu.name,
              lpu.email,
              c.is_deprecated,
              c.deprecated_at,
              du.id,
              du.name,
              du.email
          `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
         ALTER TABLE "contract" DROP CONSTRAINT "fk_contract_user_deprecated_by_id"
     `)
    await queryRunner.query(`
         ALTER TABLE "contract" DROP COLUMN "deprecated_by_id"
     `)
    await queryRunner.query(`
         ALTER TABLE "contract" DROP COLUMN "deprecated_at"
     `)
    await queryRunner.query(`
         ALTER TABLE "contract" DROP COLUMN "is_deprecated"
     `)
  }
}
