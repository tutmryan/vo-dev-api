import { createHash } from 'crypto'

export function hashSubject(subject: string): string {
  return createHash('sha256').update(subject).digest('base64')
}

import { Column, Entity, OneToMany, RelationId } from 'typeorm'
import { VerifiedOrchestrationEntity } from '../../../data/verified-orchestration-entity'
import { typeSafeAssign } from '../../../util/type-safe-assign'
import { PresentationEntity } from '../../presentation/entities/presentation-entity'

@Entity('wallet')
export class WalletEntity extends VerifiedOrchestrationEntity {
  constructor(args?: Pick<WalletEntity, 'subject'>) {
    super()
    if (!args) return
    typeSafeAssign(this, {
      ...args,
      subjectHash: hashSubject(args.subject),
    })
  }

  @Column({ type: 'varchar', length: 'MAX' })
  subject!: string

  @Column({ type: 'varchar', unique: true, length: 255 })
  subjectHash!: string

  @OneToMany(() => PresentationEntity, (presentation) => presentation.wallet)
  presentations!: Promise<PresentationEntity[]>

  @RelationId((wallet: WalletEntity) => wallet.presentations)
  presentationIds!: string[]
}
