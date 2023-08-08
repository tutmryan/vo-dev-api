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
  constructor(args?: {
    identityId: string
    userId: string
    issuanceIds: string[]
    requestedCredentials: RequestCredential[]
    presentedCredentials: PresentedData[]
  }) {
    super()
    if (!args) return
    const { issuanceIds, ...rest } = args
    typeSafeAssign(this, { ...rest, issuances: Promise.resolve(args.issuanceIds.map((id) => ({ id } as IssuanceEntity))) })
  }

  @ManyToOne(() => IdentityEntity)
  identity!: Promise<IdentityEntity | null>

  @Column({ nullable: true })
  identityId!: string | null

  @ManyToOne(() => UserEntity)
  user!: Promise<UserEntity>

  @Column()
  userId!: string

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
