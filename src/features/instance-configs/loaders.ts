import DataLoader from 'dataloader'
import { In } from 'typeorm'
import { dataSource } from '../../data'
import { ApplicationLabelConfigEntity } from './entities/application-label-config-entity'
import { CorsOriginConfigEntity } from './entities/cors-origins-config-entity'

export const applicationLabelConfigLoader = () =>
  new DataLoader<string, ApplicationLabelConfigEntity>(async (ids) => {
    const results = await dataSource.getRepository(ApplicationLabelConfigEntity).find({
      comment: 'FindApplicationLabelConfigsById',
      where: { id: In(ids) },
    })
    return ids.map((id) => results.find((result) => result.id === id) ?? new Error(`ApplicationLabelConfig not found: ${id}`))
  })

export const corsOriginConfigLoader = () =>
  new DataLoader<string, CorsOriginConfigEntity>(async (ids) => {
    const results = await dataSource.getRepository(CorsOriginConfigEntity).find({
      comment: 'FindCorsOriginConfigsById',
      where: { id: In(ids) },
    })
    return ids.map((id) => results.find((result) => result.id === id) ?? new Error(`CorsOriginConfig not found: ${id}`))
  })
