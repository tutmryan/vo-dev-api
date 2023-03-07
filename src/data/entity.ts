import { PrimaryColumn } from 'typeorm'
import { randomUUID } from 'crypto'

export class VerifiedOrchestrationEntity {
  @PrimaryColumn({ type: 'uuid' })
  public id: string = randomUUID()
}
