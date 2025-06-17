import { In } from 'typeorm'
import { notifyOidcDataChanged } from '..'
import type { CommandContext } from '../../../cqs'
import { OidcClaimMappingEntity } from '../entities/oidc-claim-mapping-entity'
import { OidcClientEntity } from '../entities/oidc-client-entity'
import { systemClientInvariant } from './utils'

export async function UpdateOidcClientClaimMappingsCommand(this: CommandContext, id: string, claimMappingIds: string[]) {
  systemClientInvariant(id)

  const repo = this.entityManager.getRepository(OidcClientEntity)
  const client = await repo.findOneByOrFail({ id })

  const claimMappings = await this.entityManager
    .getRepository(OidcClaimMappingEntity)
    .find({ where: { id: In(claimMappingIds) }, order: { name: 'ASC' } })
  checkClaimMappingConflicts(claimMappings)

  client.claimMappings = Promise.resolve(claimMappings)
  const updated = await repo.save(client)

  notifyOidcDataChanged()
  return updated
}

// Checks there are no conflicting claim mappings
function checkClaimMappingConflicts(claimMappings: OidcClaimMappingEntity[]) {
  if (claimMappings.length < 2) return // 0 or 1 mapping, no conflicts

  // create a map of claims and applicable mappings
  const mappingsByClaim: Record<string, OidcClaimMappingEntity[]> = {}
  for (const mapping of claimMappings) {
    for (const claims of Object.values(mapping.mapping)) {
      for (const claim of Object.keys(claims)) {
        if (!mappingsByClaim[claim]) mappingsByClaim[claim] = []
        mappingsByClaim[claim].push(mapping)
      }
    }
  }

  // for every unique claim, validate the mappings
  for (const [claim, mappings] of Object.entries(mappingsByClaim)) {
    if (mappings.length === 1) continue // if there's only one mapping for this claim, it's fine

    // if every mapping specifies the same credential claim, it's fine
    const uniqueCredentialClaims = new Set(mappings.map((m) => m.getScopedClaimMappings().find((c) => c.claim === claim)?.credentialClaim))
    if (uniqueCredentialClaims.size === 1) continue

    // check each mapping against the others to see if
    // A) they have conflicting credential claims and
    // B) they apply to the same credential types
    for (const mapping of mappings) {
      const thisOne = mapping.getScopedClaimMappings().find((c) => c.claim === claim)
      const otherMappings = mappings.filter((m) => m.id !== mapping.id)
      for (const other of otherMappings) {
        const another = other.getScopedClaimMappings().find((c) => c.claim === claim)
        // if they have the same credential claim, it's fine
        if (another?.credentialClaim === thisOne?.credentialClaim) continue
        const intersectsByType =
          !mapping.credentialTypes ||
          mapping.credentialTypes.length === 0 ||
          !other.credentialTypes ||
          other.credentialTypes.length === 0 ||
          mapping.credentialTypes.some((t) => other.credentialTypes!.includes(t))
        // if they apply to the same credential types, we have a conflict
        if (intersectsByType)
          throw new Error(
            `Claim "${claim}" is mapped in multiple conflicting credential claims through mappings : ${mapping.name}, ${other.name}`,
          )
      }
    }
  }
}
