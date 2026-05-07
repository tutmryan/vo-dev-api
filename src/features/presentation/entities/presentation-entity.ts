import { Column, CreateDateColumn, Entity, Index, JoinTable, ManyToMany, ManyToOne, RelationId } from 'typeorm'
import {
  dateTimeOffsetTransformer,
  dateTimeOffsetType,
  nvarcharMaxType,
  nvarcharType,
  varcharMaxLength,
} from '../../../data/utils/crossDbColumnTypes'
import { uuidLowerCaseTransformer } from '../../../data/utils/uuidLowerCaseTransformer'
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
@Index('ix_presentation_identity_id_wallet_id', ['identityId', 'walletId'])
// ix_presentation_wallet_id is a NONCLUSTERED covering index with INCLUDE columns managed via migration.
// TypeORM reads sys.index_columns which includes INCLUDE columns without distinguishing them from
// key columns, so all columns must be listed here to match what TypeORM sees in the database.
// The actual migration creates: CREATE INDEX ... ON (wallet_id) INCLUDE (identity_id, ...)
@Index('ix_presentation_wallet_id', ['walletId', 'identityId', 'oidcClientId', 'presentedAt', 'requestedById', 'requestId'])
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

  @Column({ type: nvarcharType, nullable: true })
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

  @CreateDateColumn({ type: dateTimeOffsetType, transformer: dateTimeOffsetTransformer })
  presentedAt!: Date

  @Column({ type: nvarcharMaxType, length: varcharMaxLength })
  requestedCredentialsJson!: string

  get requestedCredentials(): RequestCredential[] {
    return JSON.parse(this.requestedCredentialsJson)
  }

  set requestedCredentials(requestedCredentials: RequestCredential[]) {
    this.requestedCredentialsJson = JSON.stringify(requestedCredentials)
  }

  @Column({ type: nvarcharMaxType, length: varcharMaxLength })
  presentedCredentialsJson!: string

  get presentedCredentials(): PresentedData[] {
    return JSON.parse(this.presentedCredentialsJson)
  }

  set presentedCredentials(presentedCredentials: PresentedData[]) {
    this.presentedCredentialsJson = JSON.stringify(presentedCredentials)
  }

  @Column({ type: nvarcharMaxType, length: varcharMaxLength, nullable: true })
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
