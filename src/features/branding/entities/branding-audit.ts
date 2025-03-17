import { Entity } from 'typeorm'
import { AuditBase } from '../../auditing/entities/audit-base'

@Entity('branding_audit')
export abstract class BrandingAudit extends AuditBase {}
