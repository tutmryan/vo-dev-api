import { Column, DeleteDateColumn, Entity, JoinTable, ManyToMany, RelationId } from 'typeorm'
import {
  dateTimeOffsetTransformer,
  dateTimeOffsetType,
  nvarcharMaxType,
  nvarcharType,
  varcharMaxLength,
} from '../../../data/utils/crossDbColumnTypes'
import { uuidLowerCaseTransformer } from '../../../data/utils/uuidLowerCaseTransformer'
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

  @Column({ type: nvarcharType })
  name!: string

  @Column({ type: nvarcharMaxType, length: varcharMaxLength })
  did!: string

  @Column({ type: 'varchar', unique: true, length: 255 })
  didHash!: string

  @Column({ type: nvarcharMaxType, length: varcharMaxLength })
  credentialTypesJson!: string

  get credentialTypes(): string[] {
    return JSON.parse(this.credentialTypesJson)
  }
  set credentialTypes(types: string[]) {
    this.credentialTypesJson = JSON.stringify(types)
  }

  @Column({ type: 'uuid', nullable: true, transformer: uuidLowerCaseTransformer })
  tenantId!: string | null

  @Column({ type: 'uuid', nullable: true, transformer: uuidLowerCaseTransformer })
  issuerId!: string | null

  @Column({ type: nvarcharMaxType, length: varcharMaxLength, nullable: true })
  linkedDomainUrlsJson!: string | null

  get linkedDomainUrls(): string[] | null {
    return this.linkedDomainUrlsJson ? JSON.parse(this.linkedDomainUrlsJson) : null
  }
  set linkedDomainUrls(urls: string[] | null) {
    this.linkedDomainUrlsJson = urls ? JSON.stringify(urls) : null
  }

  @DeleteDateColumn({ type: dateTimeOffsetType, nullable: true, transformer: dateTimeOffsetTransformer })
  deletedAt!: Date | null

  @ManyToMany(() => PresentationEntity)
  @JoinTable({ name: 'presentation_partners' })
  presentations!: Promise<PresentationEntity[]>

  @RelationId((partner: PartnerEntity) => partner.presentations)
  presentationIds!: string[]
}
