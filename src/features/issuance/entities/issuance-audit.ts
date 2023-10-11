import { Entity } from 'typeorm'
import { AuditBase } from '../../auditing/entities/audit-base'

@Entity('issuance_audit')
export abstract class IssuanceAudit extends AuditBase {}
