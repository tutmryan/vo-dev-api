import DataLoader from 'dataloader'
import { In } from 'typeorm'
import { dataSource } from '../../data'
import { OidcClientEntity } from './entities/oidc-client-entity'
import { OidcResourceEntity } from './entities/oidc-resource-entity'

export const oidcClientLoader = () =>
  new DataLoader<string, OidcClientEntity>(async (ids) => {
    const results = await dataSource
      .getRepository(OidcClientEntity)
      .find({ comment: 'FindOidcClientsById', where: { id: In(ids) }, withDeleted: true })
    return ids.map(
      (id) => results.find((result) => result.id.toUpperCase() === id.toUpperCase()) ?? new Error(`OIDC client not found: ${id}`),
    )
  })

export const oidcResourceLoader = () =>
  new DataLoader<string, OidcResourceEntity>(async (ids) => {
    const results = await dataSource
      .getRepository(OidcResourceEntity)
      .find({ comment: 'FindOidcResourcesById', where: { id: In(ids) }, withDeleted: true })
    return ids.map(
      (id) => results.find((result) => result.id.toUpperCase() === id.toUpperCase()) ?? new Error(`OIDC resource not found: ${id}`),
    )
  })
