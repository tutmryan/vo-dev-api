import { Column, DeleteDateColumn, Entity, JoinTable, ManyToMany, RelationId } from 'typeorm'
import { uuidLowerCaseTransformer } from '../../../data/utils/uuid-lower-case-transformer'
import { createSha256Hash } from '../../../util/crypto-hash'
import { typeSafeAssign } from '../../../util/type-safe-assign'
import { AuditedAndTrackedEntity } from '../../auditing/entities/audited-and-tracked-entity'
import { PresentationEntity } from '../../presentation/entities/presentation-entity'

@Entity('partner')
export class PartnerEntity extends AuditedAndTrackedEntity {
  static createDidHash(did: string): string {
    return createSha256Hash(did)
  }

  constructor(args?: Pick<PartnerEntity, 'name' | 'did' | 'credentialTypes' | 'tenantId' | 'issuerId' | 'linkedDomainUrls'>) {
    super()
    if (args)
      typeSafeAssign(this, {
        ...args,
        didHash: PartnerEntity.createDidHash(args.did),
      })
  }

  @Column({ type: 'nvarchar' })
  name!: string

  @Column({ type: 'nvarchar', length: 'MAX' })
  did!: string

  @Column({ type: 'varchar', unique: true, length: 255 })
  didHash!: string

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

  @DeleteDateColumn({ type: 'datetimeoffset', nullable: true })
  deletedAt!: Date | null

  @ManyToMany(() => PresentationEntity)
  @JoinTable({ name: 'presentation_partners' })
  presentations!: Promise<PresentationEntity[]>

  @RelationId((partner: PartnerEntity) => partner.presentations)
  presentationIds!: string[]
}
