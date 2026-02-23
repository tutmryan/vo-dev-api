import { randomUUID } from 'crypto'
import { BeforeInsert, BeforeUpdate, Column, DeleteDateColumn, Entity } from 'typeorm'
import { typeSafeAssign } from '../../../util/type-safe-assign'
import { AuditedAndTrackedEntity } from '../../auditing/entities/audited-and-tracked-entity'

type CreateOrUpdateArgs = Pick<OidcResourceEntity, 'name' | 'resourceIndicator' | 'scopes'>

@Entity('oidc_resource')
export class OidcResourceEntity extends AuditedAndTrackedEntity {
  constructor(args?: CreateOrUpdateArgs & Pick<Partial<OidcResourceEntity>, 'id'>) {
    super()
    if (args) typeSafeAssign(this, { ...args, id: args.id ?? randomUUID() })
  }

  @DeleteDateColumn({ type: 'datetimeoffset', nullable: true })
  deletedAt!: Date | null

  @Column({ type: 'nvarchar' })
  name!: string

  @Column({ type: 'nvarchar', name: 'resource_indicator' })
  resourceIndicator!: string
  @BeforeInsert()
  @BeforeUpdate()
  private setResourceIndicator() {
    this.resourceIndicator = this.resourceIndicator.toString()
  }

  @Column({ type: 'nvarchar', length: 'MAX' })
  private scopesJson!: string

  get scopes(): string[] {
    return JSON.parse(this.scopesJson)
  }
  set scopes(value: string[]) {
    this.scopesJson = JSON.stringify(value)
  }

  update(args: CreateOrUpdateArgs) {
    typeSafeAssign(this, args)
  }
}
