import { Entity } from 'typeorm'
import { AuditBase } from '../../auditing/entities/audit-base'

@Entity('oidc_claim_mapping_audit')
export abstract class OidcClaimMappingAudit extends AuditBase {}
