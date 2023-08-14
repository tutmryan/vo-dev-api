import { Column, CreateDateColumn, Entity, ManyToOne, RelationId } from 'typeorm'
import { VerifiedOrchestrationEntity } from '../../../data/verified-orchestration-entity'
import { typeSafeAssign } from '../../../util/type-safe-assign'
import { ContractEntity } from '../../contracts/entities/contract-entity'
import { IdentityEntity } from '../../identity/entities/identity-entity'
import { UserEntity } from '../../users/entities/user-entity'

@Entity('issuance')
export class IssuanceEntity extends VerifiedOrchestrationEntity {
  constructor(args?: Pick<IssuanceEntity, 'id' | 'requestId' | 'contractId' | 'identityId' | 'issuedById'>) {
    super()
    if (!args) return
    typeSafeAssign(this, args)
  }

  @Column({ type: 'nvarchar', nullable: true })
  requestId!: string | null

  @ManyToOne(() => ContractEntity)
  contract!: Promise<ContractEntity>

  @Column()
  contractId!: string

  @ManyToOne(() => IdentityEntity)
  identity!: Promise<IdentityEntity>

  @Column()
  identityId!: string

  @ManyToOne(() => UserEntity)
  issuedBy!: Promise<UserEntity>

  @Column()
  issuedById!: string

  @CreateDateColumn({ type: 'datetimeoffset' })
  issuedAt!: Date

  @Column({ type: 'bit', nullable: true })
  isRevoked!: boolean | null

  @ManyToOne(() => UserEntity, { nullable: true })
  revokedBy!: Promise<UserEntity | null>

  @RelationId((issuance: IssuanceEntity) => issuance.revokedBy)
  revokedById!: string | null

  @Column({ type: 'datetimeoffset', nullable: true })
  revokedAt!: Date | null

  markAsRevoked(user: UserEntity) {
    this.isRevoked = true
    this.revokedBy = Promise.resolve(user)
    this.revokedAt = new Date()
  }
}
