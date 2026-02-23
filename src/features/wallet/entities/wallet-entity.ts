import { Column, Entity, OneToMany, RelationId } from 'typeorm'
import { nvarcharMaxLength, nvarcharMaxType } from '../../../data/utils/crossDbColumnTypes'
import { VerifiedOrchestrationEntity } from '../../../data/verified-orchestration-entity'
import { createSha256Hash } from '../../../util/crypto-hash'
import { typeSafeAssign } from '../../../util/type-safe-assign'
import { PresentationEntity } from '../../presentation/entities/presentation-entity'

@Entity('wallet')
export class WalletEntity extends VerifiedOrchestrationEntity {
  static createSubjectHash(subject: string): string {
    return createSha256Hash(subject)
  }

  constructor(args?: Pick<WalletEntity, 'subject'>) {
    super()
    if (!args) return
    typeSafeAssign(this, {
      ...args,
      subjectHash: WalletEntity.createSubjectHash(args.subject),
    })
  }

  @Column({ type: nvarcharMaxType, length: nvarcharMaxLength })
  subject!: string

  @Column({ type: 'varchar', unique: true, length: 255 })
  subjectHash!: string

  @OneToMany(() => PresentationEntity, (presentation) => presentation.wallet)
  presentations!: Promise<PresentationEntity[]>

  @RelationId((wallet: WalletEntity) => wallet.presentations)
  presentationIds!: string[]
}
