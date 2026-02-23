import { Column, Entity } from 'typeorm'
import { nvarcharMaxLength, nvarcharMaxType, nvarcharType } from '../../../data/utils/crossDbColumnTypes'
import { typeSafeAssign } from '../../../util/type-safe-assign'
import { AuditedAndTrackedEntity } from '../../auditing/entities/audited-and-tracked-entity'

@Entity('branding')
export class BrandingEntity extends AuditedAndTrackedEntity {
  constructor(args?: Pick<BrandingEntity, 'name' | 'data'>) {
    super()
    if (args) typeSafeAssign(this, args)
  }

  @Column({ type: nvarcharType })
  name!: string

  @Column({ type: nvarcharMaxType, length: nvarcharMaxLength, nullable: true })
  private dataJson!: string | null

  get data(): any | null {
    return this.dataJson ? JSON.parse(this.dataJson) : null
  }

  set data(data: any) {
    this.dataJson = JSON.stringify(data)
  }
}
