import { randomUUID } from 'crypto'
import { PrimaryColumn } from 'typeorm'
import { uuidLowerCaseTransformer } from './utils/uuid-lower-case-transformer'

export abstract class VerifiedOrchestrationEntity {
  @PrimaryColumn({ type: 'uniqueidentifier', transformer: uuidLowerCaseTransformer })
  id: string = randomUUID()
}
