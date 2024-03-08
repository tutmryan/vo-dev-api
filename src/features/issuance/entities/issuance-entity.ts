import { Column, CreateDateColumn, Entity, Index, ManyToOne, RelationId } from 'typeorm'
import { IssuanceStatus } from '../../../generated/graphql'
import { typeSafeAssign } from '../../../util/type-safe-assign'
import { AuditedAndTrackedEntity } from '../../auditing/entities/audited-and-tracked-entity'
import { ContractEntity } from '../../contracts/entities/contract-entity'
import { IdentityEntity } from '../../identity/entities/identity-entity'
import { UserEntity } from '../../users/entities/user-entity'

@Entity('issuance')
@Index(['contractId', 'issuedAt'])
export class IssuanceEntity extends AuditedAndTrackedEntity {
  constructor(args?: Pick<IssuanceEntity, 'id' | 'requestId' | 'contractId' | 'identityId' | 'issuedById' | 'expiresAt'>) {
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

  @Column({ type: 'datetimeoffset' })
  expiresAt!: Date

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

  get status(): IssuanceStatus {
    if (this.isRevoked) return IssuanceStatus.Revoked
    if (this.expiresAt.getTime() < Date.now()) return IssuanceStatus.Expired
    return IssuanceStatus.Active
  }
}
