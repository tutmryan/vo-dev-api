import { randomUUID } from 'crypto'
import { PrimaryColumn } from 'typeorm'
import { uuidLowerCaseTransformer } from './utils/uuidLowerCaseTransformer'

export abstract class VerifiedOrchestrationEntity {
  @PrimaryColumn({ type: 'uuid', transformer: uuidLowerCaseTransformer })
  id: string = randomUUID()
}
