import { Column, Entity } from 'typeorm'
import { VerifiedOrchestrationEntity } from '../../../data/verified-orchestration-entity'
import { typeSafeAssign } from '../../../util/type-safe-assign'

type RequiredArgs = Pick<CorsOriginConfigEntity, 'origin'>
export type CreateOrUpdateArgs = RequiredArgs

@Entity('cors_origin_config')
export class CorsOriginConfigEntity extends VerifiedOrchestrationEntity {
  constructor(args?: CreateOrUpdateArgs) {
    super()
    if (args) typeSafeAssign(this, args)
  }

  @Column({ name: 'origin', type: 'varchar', unique: true, length: 510 })
  origin!: string

  update(args: CreateOrUpdateArgs) {
    typeSafeAssign(this, args)
  }
}
