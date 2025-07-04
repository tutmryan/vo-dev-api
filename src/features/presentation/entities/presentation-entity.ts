import { Column, CreateDateColumn, Entity, JoinTable, ManyToMany, ManyToOne, RelationId } from 'typeorm'
import { uuidLowerCaseTransformer } from '../../../data/utils/uuid-lower-case-transformer'
import { VerifiedOrchestrationEntity } from '../../../data/verified-orchestration-entity'
import type { PresentedCredential, RequestCredential } from '../../../generated/graphql'
import { typeSafeAssign } from '../../../util/type-safe-assign'
import { IdentityEntity } from '../../identity/entities/identity-entity'
import { IssuanceEntity } from '../../issuance/entities/issuance-entity'
import { OidcClientEntity } from '../../oidc-provider/entities/oidc-client-entity'
import { PartnerEntity } from '../../partners/entities/partner-entity'
import { UserEntity } from '../../users/entities/user-entity'
import { WalletEntity } from '../../wallet/entities/wallet-entity'

export type PresentedData = Omit<PresentedCredential, 'claims'>

@Entity('presentation')
export class PresentationEntity extends VerifiedOrchestrationEntity {
  constructor(
    args?: Pick<
      PresentationEntity,
      'requestId' | 'identityId' | 'requestedById' | 'issuanceIds' | 'requestedCredentials' | 'presentedCredentials' | 'partnerIds'
    > &
      Partial<Pick<PresentationEntity, 'walletId' | 'oidcClientId' | 'receiptJson'>>,
  ) {
    super()
    if (!args) return
    const { issuanceIds, partnerIds, oidcClientId, walletId, receiptJson, ...rest } = args
    typeSafeAssign(this, {
      ...rest,
      issuances: Promise.resolve(issuanceIds.map((id) => ({ id }) as IssuanceEntity)),
      partners: Promise.resolve(partnerIds.map((id) => ({ id }) as PartnerEntity)),
      oidcClientId: oidcClientId ?? null,
      walletId: walletId ?? null,
      receiptJson: receiptJson ?? null,
    })
  }

  @Column({ type: 'nvarchar', nullable: true })
  requestId!: string | null

  @ManyToOne(() => IdentityEntity)
  identity!: Promise<IdentityEntity | null>

  @Column({ nullable: true, transformer: uuidLowerCaseTransformer })
  identityId!: string | null

  @ManyToOne(() => UserEntity)
  requestedBy!: Promise<UserEntity>

  @Column({ transformer: uuidLowerCaseTransformer })
  requestedById!: string

  @ManyToMany(() => IssuanceEntity)
  @JoinTable({ name: 'presentation_issuances' })
  issuances!: Promise<IssuanceEntity[]>

  @RelationId((presentation: PresentationEntity) => presentation.issuances)
  issuanceIds!: string[]

  @ManyToMany(() => PartnerEntity)
  @JoinTable({ name: 'presentation_partners' })
  partners!: Promise<PartnerEntity[]>

  @RelationId((presentation: PresentationEntity) => presentation.partners)
  partnerIds!: string[]

  @CreateDateColumn({ type: 'datetimeoffset' })
  presentedAt!: Date

  @Column({ type: 'nvarchar', length: 'MAX' })
  requestedCredentialsJson!: string

  get requestedCredentials(): RequestCredential[] {
    return JSON.parse(this.requestedCredentialsJson)
  }

  set requestedCredentials(requestedCredentials: RequestCredential[]) {
    this.requestedCredentialsJson = JSON.stringify(requestedCredentials)
  }

  @Column({ type: 'nvarchar', length: 'MAX' })
  presentedCredentialsJson!: string

  get presentedCredentials(): PresentedData[] {
    return JSON.parse(this.presentedCredentialsJson)
  }

  set presentedCredentials(presentedCredentials: PresentedData[]) {
    this.presentedCredentialsJson = JSON.stringify(presentedCredentials)
  }

  @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
  receiptJson!: string | null

  get receipt(): Record<string, unknown> | null {
    return this.receiptJson ? JSON.parse(this.receiptJson) : null
  }

  @ManyToOne(() => OidcClientEntity)
  oidcClient!: Promise<OidcClientEntity | null>

  @Column({ nullable: true, transformer: uuidLowerCaseTransformer })
  oidcClientId!: string | null

  @ManyToOne(() => WalletEntity, { nullable: true })
  wallet!: Promise<WalletEntity | null>

  @Column({ nullable: true, transformer: uuidLowerCaseTransformer })
  walletId!: string | null
}
