import { Column, Entity } from 'typeorm'
import { booleanType, nvarcharMaxType, nvarcharType, varcharMaxLength } from '../../../data/utils/crossDbColumnTypes'
import type { Action, DataDefinition, PresentationRequestInput } from '../../../generated/graphql'
import { AuditedAndTrackedEntity } from '../../auditing/entities/audited-and-tracked-entity'

export interface FieldVisibility {
  title?: boolean
  prePresentationText?: boolean
  postPresentationText?: boolean
  credentialTypes?: boolean
  allowRevoked?: boolean
  faceCheck?: boolean
  expiresAt?: boolean
  dataSchema?: boolean
  actions?: boolean
  autoSubmit?: boolean
  constraints?: boolean
  clientName?: boolean
}

@Entity('presentation_flow_template')
export class PresentationFlowTemplateEntity extends AuditedAndTrackedEntity {
  @Column({ type: nvarcharType, length: 255 })
  name!: string

  @Column({ type: nvarcharMaxType, length: varcharMaxLength, nullable: true })
  title!: string | null

  @Column({ type: nvarcharMaxType, length: varcharMaxLength, nullable: true })
  prePresentationText!: string | null

  @Column({ type: nvarcharMaxType, length: varcharMaxLength, nullable: true })
  postPresentationText!: string | null

  @Column({ type: nvarcharMaxType, length: varcharMaxLength })
  presentationRequestJson!: string

  @Column({ type: nvarcharMaxType, length: varcharMaxLength, nullable: true })
  dataSchemaJson!: string | null

  @Column({ type: nvarcharMaxType, length: varcharMaxLength, nullable: true })
  actionsJson!: string | null

  @Column({ type: booleanType, nullable: true })
  autoSubmit!: boolean | null

  @Column({ type: 'int', nullable: true })
  expiresAfterDays!: number | null

  @Column({ type: nvarcharMaxType, length: varcharMaxLength })
  fieldVisibilityJson!: string

  @Column({ type: booleanType, default: false })
  isDeleted!: boolean

  get presentationRequest(): PresentationRequestInput {
    return JSON.parse(this.presentationRequestJson) as PresentationRequestInput
  }

  get dataSchema(): DataDefinition[] | null {
    return this.dataSchemaJson ? (JSON.parse(this.dataSchemaJson) as DataDefinition[]) : null
  }

  get actions(): Action[] | null {
    return this.actionsJson ? (JSON.parse(this.actionsJson) as Action[]) : null
  }

  get fieldVisibility(): FieldVisibility {
    return JSON.parse(this.fieldVisibilityJson) as FieldVisibility
  }
}
