import { Column, Entity, Index, ManyToOne } from 'typeorm'
import { nvarcharMaxLength, nvarcharMaxType } from '../../../data/utils/crossDbColumnTypes'
import { uuidLowerCaseTransformer } from '../../../data/utils/uuidLowerCaseTransformer'
import { typeSafeAssign } from '../../../util/type-safe-assign'
import { AuditedAndTrackedEntity } from '../../auditing/entities/audited-and-tracked-entity'
import { OidcClientEntity } from './oidc-client-entity'
import { OidcResourceEntity } from './oidc-resource-entity'

@Entity('oidc_client_resource')
@Index(['clientId', 'resourceId'], { unique: true })
export class OidcClientResourceEntity extends AuditedAndTrackedEntity {
  constructor(args?: Pick<OidcClientResourceEntity, 'clientId' | 'resourceId' | 'resourceScopes'>) {
    super()
    if (args) typeSafeAssign(this, args)
  }

  @ManyToOne(() => OidcClientEntity)
  client!: Promise<OidcClientEntity>

  @Column({ transformer: uuidLowerCaseTransformer })
  clientId!: string

  /**
   * Allow the client to use this resource.
   */
  @ManyToOne(() => OidcResourceEntity)
  resource!: Promise<OidcResourceEntity>

  @Column({ transformer: uuidLowerCaseTransformer })
  resourceId!: string

  /**
   * Defines the scopes that the client may request for the resource.
   */
  @Column({ type: nvarcharMaxType, length: nvarcharMaxLength })
  private resourceScopesJson!: string

  get resourceScopes(): string[] {
    return JSON.parse(this.resourceScopesJson)
  }
  set resourceScopes(value: string[]) {
    this.resourceScopesJson = JSON.stringify(value)
  }

  update({ resourceScopes }: Pick<OidcClientResourceEntity, 'resourceScopes'>) {
    this.resourceScopes = resourceScopes
  }
}
