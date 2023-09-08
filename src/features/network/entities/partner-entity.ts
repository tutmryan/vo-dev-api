import { Column, Entity } from 'typeorm'
import { VerifiedOrchestrationEntity } from '../../../data/verified-orchestration-entity'
import { typeSafeAssign } from '../../../util/type-safe-assign'

@Entity('partner')
export class PartnerEntity extends VerifiedOrchestrationEntity {
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

  @Column({ type: 'uniqueidentifier', nullable: true })
  tenantId!: string | null

  @Column({ type: 'uniqueidentifier', nullable: true })
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
