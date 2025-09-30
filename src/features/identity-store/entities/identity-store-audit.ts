import { Entity } from 'typeorm'
import { AuditBase } from '../../auditing/entities/audit-base'

@Entity('identity_store_audit')
export abstract class IdentityStoreAudit extends AuditBase {}
