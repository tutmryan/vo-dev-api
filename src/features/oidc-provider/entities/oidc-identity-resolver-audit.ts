import { Entity } from 'typeorm'
import { AuditBase } from '../../auditing/entities/audit-base'

@Entity('oidc_identity_resolver_audit')
export abstract class OidcIdentityResolverAudit extends AuditBase {}
