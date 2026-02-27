import { Entity } from 'typeorm'
import { AuditBase } from '../../auditing/entities/audit-base'

@Entity('presentation_flow_audit')
export abstract class PresentationFlowAudit extends AuditBase {}
