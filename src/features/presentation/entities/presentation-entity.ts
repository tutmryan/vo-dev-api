import { Column, CreateDateColumn, Entity, JoinTable, ManyToMany, ManyToOne } from 'typeorm'
import { VerifiedOrchestrationEntity } from '../../../data/verified-orchestration-entity'
import type { PresentedCredential, RequestCredential } from '../../../generated/graphql'
import { typeSafeAssign } from '../../../util/type-safe-assign'
import { ContractEntity } from '../../contracts/entities/contract-entity'
import { IdentityEntity } from '../../identity/entities/identity-entity'
import { UserEntity } from '../../users/entities/user-entity'

export type PresentedData = Omit<PresentedCredential, 'claims'>

@Entity('presentation', { orderBy: { presentedAt: 'DESC' } })
export class PresentationEntity extends VerifiedOrchestrationEntity {
  constructor(args?: {
    identityId: string
    userId: string
    contractIds: string[]
    requestedCredentials: RequestCredential[]
    presentedCredentials: PresentedData[]
  }) {
    super()
    if (!args) return
    const { contractIds, ...rest } = args
    typeSafeAssign(this, { ...rest, contracts: Promise.resolve(args.contractIds.map((id) => ({ id } as ContractEntity))) })
  }

  @ManyToOne(() => IdentityEntity)
  identity!: Promise<IdentityEntity | null>

  @Column({ nullable: true })
  identityId!: string | null

  @ManyToOne(() => UserEntity)
  user!: Promise<UserEntity>

  @Column()
  userId!: string

  @ManyToMany(() => ContractEntity)
  @JoinTable({ name: 'presentation_contracts' })
  contracts!: Promise<ContractEntity[]>

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
