import DataLoader from 'dataloader'
import { In } from 'typeorm'
import { dataSource, entityManager } from '../../data'
import { PresentationEntity } from '../presentation/entities/presentation-entity'
import { WalletEntity } from './entities/wallet-entity'

const aggAlias = {
  MIN: 'FirstUsed',
  MAX: 'LastUsed',
} as const

type AggregationType = keyof typeof aggAlias

export const walletLoader = () =>
  new DataLoader<string, WalletEntity>(async (ids) => {
    const results = await dataSource.getRepository(WalletEntity).find({ comment: 'FindWalletsById', where: { id: In(ids) } })
    return ids.map((id) => results.find((result) => result.id === id) ?? new Error(`Wallet not found: ${id}`))
  })

export const walletUsedDateLoader = (aggregation: AggregationType) => {
  const alias = aggAlias[aggregation]

  return new DataLoader<string, Date>(async (walletIds) => {
    const results = await entityManager
      .getRepository(PresentationEntity)
      .createQueryBuilder('presentation')
      .select('LOWER(presentation.walletId)', 'walletId')
      .addSelect(`${aggregation}(presentation.presentedAt)`, alias)
      .where('LOWER(presentation.walletId) IN (:...walletIds)', { walletIds })
      .groupBy('LOWER(presentation.walletId)')
      .comment(`FindWallet${alias}ByWalletId`)
      .getRawMany<Record<string, string>>()

    const resultMap = new Map<string, Date>()
    for (const row of results) {
      const walletId = row.walletId
      const dateString = row[alias]
      if (walletId && dateString) {
        resultMap.set(walletId, new Date(dateString.endsWith('Z') ? dateString : `${dateString}Z`))
      }
    }

    return walletIds.map((id) => {
      const date = resultMap.get(id)
      if (!date) throw new Error(`No ${alias} date found for walletId: ${id}`)
      return date
    })
  })
}
