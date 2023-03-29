import { AuditBase } from '../../auditing/entities/audit-base'
import { Entity } from 'typeorm'

@Entity('template_audit')
export abstract class TemplateAudit extends AuditBase {}
