import { MigrationInterface, QueryRunner } from 'typeorm'

export class ChangePresentationContractsToPresentationIssuances1691142288189 implements MigrationInterface {
  name = 'ChangePresentationContractsToPresentationIssuances1691142288189'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // drop presentation_contracts
    await queryRunner.query(`
            DROP TABLE "presentation_contracts"
        `)

    // create presentation_issuances
    await queryRunner.query(`
            CREATE TABLE "presentation_issuances" (
                "presentation_id" uniqueidentifier NOT NULL,
                "issuance_id" uniqueidentifier NOT NULL,
                CONSTRAINT "id_presentation_issuances" PRIMARY KEY ("presentation_id", "issuance_id")
            )
        `)
    await queryRunner.query(`
            CREATE INDEX "ix_presentation_issuances_presentation_id" ON "presentation_issuances" ("presentation_id")
        `)
    await queryRunner.query(`
            CREATE INDEX "ix_presentation_issuances_issuance_id" ON "presentation_issuances" ("issuance_id")
        `)
    await queryRunner.query(`
            ALTER TABLE "presentation_issuances"
            ADD CONSTRAINT "fk_presentation_issuances_presentation_presentation_id" FOREIGN KEY ("presentation_id") REFERENCES "presentation"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `)
    await queryRunner.query(`
            ALTER TABLE "presentation_issuances"
            ADD CONSTRAINT "fk_presentation_issuances_issuance_issuance_id" FOREIGN KEY ("issuance_id") REFERENCES "issuance"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `)

    // update presentation_contracts_view
    await queryRunner.query(`
      ALTER VIEW presentation_contracts_view AS
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
          u.id          as presented_to_id,
          u.name        as presented_to_name,
          u.email       as presented_to_email,
          u.is_app      as presented_to_is_app,
          id.id         as presented_by_id,
          id.identifier as presented_by_identifier,
          id.name       as presented_by_name,
          id.issuer     as presented_by_issuer
        from presentation_issuances pi
          inner join issuance i on i.id = pi.issuance_id
          inner join contract c on c.id = i.contract_id
          inner join presentation p on p.id = pi.presentation_id
          inner join [user] u on u.id = p.user_id
          left join [identity] id on id.id = p.identity_id
          left join template t on t.id = c.template_id
    `)

    // update contract_view
    await queryRunner.query(`
      ALTER VIEW contract_view AS
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
          (SELECT COUNT(*) FROM presentation_issuances pi
              inner join issuance i on i.id = pi.issuance_id
              where i.contract_id = c.id)                                              as presentation_count
        from contract c
          left join template t on c.template_id = t.id
          left join [user] cu on c.created_by_id = cu.id
          left join [user] ubu on c.updated_by_id = ubu.id
          left join [user] pu on c.provisioned_by_id = pu.id
          left join [user] lpu on c.last_provisioned_by_id = lpu.id
      `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // drop presentation_issuances
    await queryRunner.query(`
            DROP TABLE "presentation_issuances"
        `)

    // re-create presentation_contracts
    await queryRunner.query(`
      CREATE TABLE "presentation_contracts" (
          "presentation_id" uniqueidentifier NOT NULL,
          "contract_id" uniqueidentifier NOT NULL,
          CONSTRAINT "id_presentation_contracts" PRIMARY KEY ("presentation_id", "contract_id")
      )
    `)
    await queryRunner.query(`
      CREATE INDEX "ix_presentation_contracts_presentation_id" ON "presentation_contracts" ("presentation_id")
    `)
    await queryRunner.query(`
      CREATE INDEX "ix_presentation_contracts_contract_id" ON "presentation_contracts" ("contract_id")
    `)
    await queryRunner.query(`
      ALTER TABLE "presentation_contracts"
      ADD CONSTRAINT "fk_presentation_contracts_presentation_presentation_id" FOREIGN KEY ("presentation_id") REFERENCES "presentation"("id") ON DELETE CASCADE ON UPDATE CASCADE
    `)
    await queryRunner.query(`
      ALTER TABLE "presentation_contracts"
      ADD CONSTRAINT "fk_presentation_contracts_contract_contract_id" FOREIGN KEY ("contract_id") REFERENCES "contract"("id") ON DELETE CASCADE ON UPDATE CASCADE
    `)

    // restore presentation_contracts_view
    await queryRunner.query(`
      ALTER VIEW presentation_contracts_view AS
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
          u.id          as presented_to_id,
          u.name        as presented_to_name,
          u.email       as presented_to_email,
          u.is_app      as presented_to_is_app,
          id.id         as presented_by_id,
          id.identifier as presented_by_identifier,
          id.name       as presented_by_name,
          id.issuer     as presented_by_issuer
        from presentation_contracts pc
          inner join contract c on c.id = pc.contract_id
          inner join presentation p on p.id = pc.presentation_id
          inner join [user] u on u.id = p.user_id
          left join [identity] id on id.id = p.identity_id
          left join template t on t.id = c.template_id
    `)

    // restore contract_view
    await queryRunner.query(`
        ALTER VIEW contract_view AS
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
}
