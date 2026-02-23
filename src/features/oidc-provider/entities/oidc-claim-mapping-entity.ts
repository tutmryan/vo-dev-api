import { sortBy } from 'lodash'
import { Column, DeleteDateColumn, Entity } from 'typeorm'
import { ScopedClaimMapping } from '../../../generated/graphql'
import { typeSafeAssign } from '../../../util/type-safe-assign'
import { AuditedAndTrackedEntity } from '../../auditing/entities/audited-and-tracked-entity'

export type ClaimMapping = Record<string, Record<string, string>>

type CreateOrUpdateArgs = Pick<OidcClaimMappingEntity, 'name' | 'mapping' | 'credentialTypes'>

@Entity('oidc_claim_mapping')
export class OidcClaimMappingEntity extends AuditedAndTrackedEntity {
  constructor(args?: CreateOrUpdateArgs) {
    super()
    if (args) typeSafeAssign(this, args)
  }

  @DeleteDateColumn({ type: 'datetimeoffset', nullable: true })
  deletedAt!: Date | null

  @Column({ type: 'nvarchar' })
  name!: string

  @Column({ type: 'nvarchar', length: 'MAX' })
  private mappingJson!: string

  get mapping(): ClaimMapping {
    return JSON.parse(this.mappingJson)
  }
  set mapping(value: ClaimMapping) {
    this.mappingJson = JSON.stringify(value)
  }

  @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
  credentialTypesJson!: string | null

  get credentialTypes(): string[] | null {
    return this.credentialTypesJson ? JSON.parse(this.credentialTypesJson) : null
  }
  set credentialTypes(types: string[] | null) {
    this.credentialTypesJson = types ? JSON.stringify(types) : null
  }

  update(args: CreateOrUpdateArgs) {
    typeSafeAssign(this, args)
  }

  delete() {
    this.deletedAt = new Date()
  }

  getScopedClaimMappings(): ScopedClaimMapping[] {
    return Object.entries(this.mapping).flatMap(([scope, mappings]) =>
      Object.entries(mappings).map(([claim, credentialClaim]) => ({
        scope,
        claim,
        credentialClaim,
      })),
    )
  }

  static validateScopedMappings(mappings: ScopedClaimMapping[]): void {
    const uniqueClaims = new Set<string>()
    for (const { scope, claim, credentialClaim } of mappings) {
      if (!scope || !claim || !credentialClaim) {
        throw new Error(`Invalid scoped mapping: ${JSON.stringify({ scope, claim, credentialClaim })}`)
      }
      if (uniqueClaims.has(claim)) {
        throw new Error(`Duplicate claim "${claim}" found in scoped mappings`)
      }
      uniqueClaims.add(claim)
    }
  }

  static reduceScopedMappings(mappings: ScopedClaimMapping[]): ClaimMapping {
    return sortBy(mappings, ['scope', 'claim']).reduce((acc, { scope, claim, credentialClaim }) => {
      if (!acc[scope]) acc[scope] = {}
      acc[scope][claim] = credentialClaim
      return acc
    }, {} as ClaimMapping)
  }
}
