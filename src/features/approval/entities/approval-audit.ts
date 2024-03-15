import { Entity } from 'typeorm'
import { AuditBase } from '../../auditing/entities/audit-base'

@Entity('approval_audit')
export abstract class ApprovalAudit extends AuditBase { }
