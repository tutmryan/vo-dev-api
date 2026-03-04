import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm'
import { booleanType, dateTimeOffsetType, nvarcharMaxType, nvarcharType, varcharMaxLength } from '../../../data/utils/crossDbColumnTypes'
import { uuidLowerCaseTransformer } from '../../../data/utils/uuidLowerCaseTransformer'
import type { Action, Callback, DataDefinition, PresentationFlowStatus, PresentationRequestInput } from '../../../generated/graphql'
import { PresentationFlowStatus as PresentationFlowStatusEnum } from '../../../generated/graphql'
import { AuditedAndTrackedEntity } from '../../auditing/entities/audited-and-tracked-entity'
import { IdentityEntity } from '../../identity/entities/identity-entity'
import { PresentationEntity } from '../../presentation/entities/presentation-entity'
import { PresentationFlowTemplateEntity } from './presentation-flow-template-entity'

@Entity('presentation_flow')
export class PresentationFlowEntity extends AuditedAndTrackedEntity {
  @ManyToOne(() => PresentationFlowTemplateEntity, { nullable: true })
  @JoinColumn({ name: 'template_id', foreignKeyConstraintName: 'fk_presentation_flow_template_template_id' })
  template!: Promise<PresentationFlowTemplateEntity | null>

  @Column({ type: 'uuid', nullable: true, transformer: uuidLowerCaseTransformer })
  templateId!: string | null

  @ManyToOne(() => IdentityEntity, { nullable: true })
  @JoinColumn({ name: 'identity_id', foreignKeyConstraintName: 'fk_presentation_flow_identity_identity_id' })
  identity!: Promise<IdentityEntity | null>

  @Column({ type: dateTimeOffsetType })
  expiresAt!: Date

  @Column({ type: nvarcharMaxType, length: varcharMaxLength, nullable: true })
  title!: string | null

  @Column({ type: nvarcharType, nullable: true })
  correlationId!: string | null

  @Column({ type: 'uuid', nullable: true, transformer: uuidLowerCaseTransformer })
  identityId!: string | null

  @Column({ type: nvarcharMaxType, length: varcharMaxLength, nullable: true })
  prePresentationText!: string | null

  @Column({ type: nvarcharMaxType, length: varcharMaxLength, nullable: true })
  postPresentationText!: string | null

  @Column({ type: nvarcharMaxType, length: varcharMaxLength, nullable: true })
  requestDataJson!: string | null

  @Column({ type: nvarcharMaxType, length: varcharMaxLength })
  presentationRequestJson!: string

  @Column({ type: nvarcharMaxType, length: varcharMaxLength, nullable: true })
  dataSchemaJson!: string | null

  @Column({ type: nvarcharMaxType, length: varcharMaxLength, nullable: true })
  dataResultsJson!: string | null

  @Column({ type: nvarcharMaxType, length: varcharMaxLength, nullable: true })
  actionsJson!: string | null

  @Column({ type: booleanType, nullable: true })
  autoSubmit!: boolean | null

  @Column({ type: nvarcharType, length: 255, nullable: true })
  actionKey!: string | null

  @Column({ type: nvarcharMaxType, length: varcharMaxLength, nullable: true })
  callbackJson!: string | null

  @Column({ type: 'uuid', transformer: uuidLowerCaseTransformer })
  callbackSecret!: string

  @ManyToOne(() => PresentationEntity)
  presentation!: Promise<PresentationEntity | null>

  @Column({ type: 'uuid', nullable: true, transformer: uuidLowerCaseTransformer })
  presentationId!: string | null

  @Column({ type: booleanType, nullable: true })
  isRequestCreated!: boolean | null

  @Column({ type: booleanType, nullable: true })
  isRequestRetrieved!: boolean | null

  @Column({ type: booleanType, nullable: true })
  isCancelled!: boolean | null

  @Column({ type: booleanType, nullable: true })
  isSubmitted!: boolean | null

  get requestData(): Record<string, unknown> | null {
    return this.requestDataJson ? (JSON.parse(this.requestDataJson) as Record<string, unknown>) : null
  }

  get presentationRequest(): Record<string, unknown> {
    return JSON.parse(this.presentationRequestJson) as Record<string, unknown>
  }

  get presentationRequestAsInput(): PresentationRequestInput {
    return JSON.parse(this.presentationRequestJson) as PresentationRequestInput
  }

  get callback(): Callback | null {
    return this.callbackJson ? (JSON.parse(this.callbackJson) as Callback) : null
  }

  get dataSchema(): DataDefinition[] | null {
    return this.dataSchemaJson ? (JSON.parse(this.dataSchemaJson) as DataDefinition[]) : null
  }

  get dataResults(): Record<string, unknown> | null {
    return this.dataResultsJson ? (JSON.parse(this.dataResultsJson) as Record<string, unknown>) : null
  }

  get actions(): Action[] | null {
    return this.actionsJson ? (JSON.parse(this.actionsJson) as Action[]) : null
  }

  get status(): PresentationFlowStatus {
    if (this.isCancelled) return PresentationFlowStatusEnum.Cancelled
    if (this.isSubmitted) return PresentationFlowStatusEnum.Submitted
    if (this.presentationId) return PresentationFlowStatusEnum.PresentationVerified
    if (this.expiresAt.getTime() < Date.now()) return PresentationFlowStatusEnum.Expired
    if (this.isRequestRetrieved) return PresentationFlowStatusEnum.RequestRetrieved
    if (this.isRequestCreated) return PresentationFlowStatusEnum.RequestCreated
    return PresentationFlowStatusEnum.Pending
  }
}
