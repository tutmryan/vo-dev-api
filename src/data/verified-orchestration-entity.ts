import { randomUUID } from 'crypto'
import { PrimaryColumn } from 'typeorm'

export abstract class VerifiedOrchestrationEntity {
  @PrimaryColumn({ type: 'uniqueidentifier' })
  id: string = randomUUID()
}
