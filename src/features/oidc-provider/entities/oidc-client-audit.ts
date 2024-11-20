import { Entity } from 'typeorm'
import { AuditBase } from '../../auditing/entities/audit-base'

@Entity('oidc_client_audit')
export abstract class OidcClientAudit extends AuditBase {}
