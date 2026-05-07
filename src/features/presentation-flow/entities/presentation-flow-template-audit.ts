import { Entity } from 'typeorm'
import { AuditBase } from '../../auditing/entities/audit-base'

@Entity('presentation_flow_template_audit')
export abstract class PresentationFlowTemplateAudit extends AuditBase {}
