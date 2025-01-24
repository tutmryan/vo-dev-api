import { Column, Entity } from 'typeorm'
import { uuidLowerCaseTransformer } from '../../../data/utils/uuid-lower-case-transformer'
import { typeSafeAssign } from '../../../util/type-safe-assign'
import { AuditedAndTrackedEntity } from '../../auditing/entities/audited-and-tracked-entity'

@Entity('partner')
export class PartnerEntity extends AuditedAndTrackedEntity {
  constructor(args?: Pick<PartnerEntity, 'name' | 'did' | 'credentialTypes' | 'tenantId' | 'issuerId' | 'linkedDomainUrls'>) {
    super()
    if (args) typeSafeAssign(this, args)
  }

  @Column({ type: 'nvarchar' })
  name!: string

  @Column({ type: 'nvarchar', length: 'MAX' })
  did!: string

  @Column({ type: 'nvarchar', length: 'MAX' })
  credentialTypesJson!: string

  get credentialTypes(): string[] {
    return JSON.parse(this.credentialTypesJson)
  }
  set credentialTypes(types: string[]) {
    this.credentialTypesJson = JSON.stringify(types)
  }

  @Column({ type: 'uniqueidentifier', nullable: true, transformer: uuidLowerCaseTransformer })
  tenantId!: string | null

  @Column({ type: 'uniqueidentifier', nullable: true, transformer: uuidLowerCaseTransformer })
  issuerId!: string | null

  @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
  linkedDomainUrlsJson!: string | null

  get linkedDomainUrls(): string[] | null {
    return this.linkedDomainUrlsJson ? JSON.parse(this.linkedDomainUrlsJson) : null
  }
  set linkedDomainUrls(urls: string[] | null) {
    this.linkedDomainUrlsJson = urls ? JSON.stringify(urls) : null
  }
}
