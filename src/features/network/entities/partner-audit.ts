import { Entity } from 'typeorm'
import { AuditBase } from '../../auditing/entities/audit-base'

@Entity('partner_audit')
export abstract class PartnerAudit extends AuditBase {}
