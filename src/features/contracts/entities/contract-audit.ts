import { AuditBase } from '../../auditing/entities/audit-base'
import { Entity } from 'typeorm'

@Entity('contract_audit')
export abstract class ContractAudit extends AuditBase {}
