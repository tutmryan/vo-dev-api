import { Column, CreateDateColumn, Entity, JoinTable, ManyToMany, ManyToOne, RelationId } from 'typeorm'
import { VerifiedOrchestrationEntity } from '../../../data/verified-orchestration-entity'
import type { PresentedCredential, RequestCredential } from '../../../generated/graphql'
import { typeSafeAssign } from '../../../util/type-safe-assign'
import { IdentityEntity } from '../../identity/entities/identity-entity'
import { IssuanceEntity } from '../../issuance/entities/issuance-entity'
import { UserEntity } from '../../users/entities/user-entity'

export type PresentedData = Omit<PresentedCredential, 'claims'>

@Entity('presentation')
export class PresentationEntity extends VerifiedOrchestrationEntity {
  constructor(
    args?: Pick<
      PresentationEntity,
      'requestId' | 'identityId' | 'requestedById' | 'issuanceIds' | 'requestedCredentials' | 'presentedCredentials'
    >,
  ) {
    super()
    if (!args) return
    const { issuanceIds, ...rest } = args
    typeSafeAssign(this, { ...rest, issuances: Promise.resolve(args.issuanceIds.map((id) => ({ id } as IssuanceEntity))) })
  }

  @Column({ type: 'nvarchar', nullable: true })
  requestId!: string | null

  @ManyToOne(() => IdentityEntity)
  identity!: Promise<IdentityEntity | null>

  @Column({ nullable: true })
  identityId!: string | null

  @ManyToOne(() => UserEntity)
  requestedBy!: Promise<UserEntity>

  @RelationId((presentation: PresentationEntity) => presentation.requestedBy)
  requestedById!: string

  @ManyToMany(() => IssuanceEntity)
  @JoinTable({ name: 'presentation_issuances' })
  issuances!: Promise<IssuanceEntity[]>

  @RelationId((presentation: PresentationEntity) => presentation.issuances)
  issuanceIds!: string[]

  @CreateDateColumn({ type: 'datetimeoffset' })
  presentedAt!: Date

  @Column({ type: 'nvarchar', length: 'MAX' })
  private requestedCredentialsJson!: string

  get requestedCredentials(): RequestCredential[] {
    return JSON.parse(this.requestedCredentialsJson)
  }

  set requestedCredentials(requestedCredentials: RequestCredential[]) {
    this.requestedCredentialsJson = JSON.stringify(requestedCredentials)
  }

  @Column({ type: 'nvarchar', length: 'MAX' })
  private presentedCredentialsJson!: string

  get presentedCredentials(): PresentedData[] {
    return JSON.parse(this.presentedCredentialsJson)
  }

  set presentedCredentials(presentedCredentials: PresentedData[]) {
    this.presentedCredentialsJson = JSON.stringify(presentedCredentials)
  }
}
