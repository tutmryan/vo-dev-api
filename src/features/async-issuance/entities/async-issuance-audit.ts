import { Entity } from 'typeorm'
import { AuditBase } from '../../auditing/entities/audit-base'

@Entity('async_issuance_audit')
export abstract class AsyncIssuanceAudit extends AuditBase {}
