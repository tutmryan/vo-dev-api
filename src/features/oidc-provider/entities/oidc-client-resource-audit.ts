import { Entity } from 'typeorm'
import { AuditBase } from '../../auditing/entities/audit-base'

@Entity('oidc_client_resource_audit')
export abstract class OidcClientResourceAudit extends AuditBase {}
