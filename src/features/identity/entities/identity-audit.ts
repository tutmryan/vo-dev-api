import { Entity } from 'typeorm'
import { AuditBase } from '../../auditing/entities/audit-base'

@Entity('identity_audit')
export abstract class IdentityAudit extends AuditBase {}
