import { MigrationInterface, QueryRunner } from 'typeorm'

export class PresentationView1683686278182 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        CREATE VIEW presentation_view AS
          select p.id,
            p.presented_at,
            p.requested_credentials_json,
            p.presented_credentials_json,
            u.id          as presented_by_id,
            u.name        as presented_by_name,
            u.email       as presented_by_email,
            u.is_app      as presented_by_is_app,
            id.id         as presented_to_id,
            id.identifier as presented_to_identifier,
            id.name       as presented_to_name,
            id.issuer     as presented_to_issuer
          from presentation p
            inner join [user] u on u.id = p.user_id
            left join [identity] id on id.id = p.identity_id
      `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP VIEW presentation_view
    `)
  }
}
