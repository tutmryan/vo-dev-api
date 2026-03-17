import DataLoader from 'dataloader'
import { In } from 'typeorm'
import { dataSource } from '../../data'
import { OidcClaimMappingEntity } from './entities/oidc-claim-mapping-entity'
import { OidcClientEntity } from './entities/oidc-client-entity'
import { OidcIdentityResolverEntity } from './entities/oidc-identity-resolver-entity'
import { OidcResourceEntity } from './entities/oidc-resource-entity'

export const oidcClientLoader = () =>
  new DataLoader<string, OidcClientEntity>(async (ids) => {
    const results = await dataSource
      .getRepository(OidcClientEntity)
      .find({ comment: 'FindOidcClientsById', where: { id: In(ids) }, withDeleted: true })
    return ids.map((id) => results.find((result) => result.id === id) ?? new Error(`OIDC client not found: ${id}`))
  })

export const oidcResourceLoader = () =>
  new DataLoader<string, OidcResourceEntity>(async (ids) => {
    const results = await dataSource
      .getRepository(OidcResourceEntity)
      .find({ comment: 'FindOidcResourcesById', where: { id: In(ids) }, withDeleted: true })
    return ids.map((id) => results.find((result) => result.id === id) ?? new Error(`OIDC resource not found: ${id}`))
  })

export const oidcClaimMappingsLoader = () =>
  new DataLoader<string, OidcClaimMappingEntity>(async (ids) => {
    const results = await dataSource
      .getRepository(OidcClaimMappingEntity)
      .find({ comment: 'FindOidcClaimMappingsById', where: { id: In(ids) }, withDeleted: true })
    return ids.map((id) => results.find((r) => r.id === id) ?? new Error(`OIDC claim mapping not found: ${id}`))
  })

export const oidcIdentityResolversLoader = () =>
  new DataLoader<string, OidcIdentityResolverEntity>(async (ids) => {
    const results = await dataSource
      .getRepository(OidcIdentityResolverEntity)
      .find({ comment: 'FindOidcIdentityResolversById', where: { id: In(ids) }, withDeleted: true })
    return ids.map((id) => results.find((r) => r.id === id) ?? new Error(`OIDC identity resolver not found: ${id}`))
  })
