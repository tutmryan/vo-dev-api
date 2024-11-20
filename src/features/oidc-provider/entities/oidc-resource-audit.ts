import { Entity } from 'typeorm'
import { AuditBase } from '../../auditing/entities/audit-base'

@Entity('oidc_resource_audit')
export abstract class OidcResourceAudit extends AuditBase {}
