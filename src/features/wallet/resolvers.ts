import { query } from '../../cqs/dispatcher'
import type { Resolvers } from '../../generated/graphql'
import { FindWalletsQuery } from './queries/find-wallets-query'

export const resolvers: Resolvers = {
  Query: {
    wallet: (_, { id }, { dataLoaders: { wallets } }) => wallets.load(id),
    findWallets: (_, { where, offset, limit }, context) => query(context, FindWalletsQuery, where, offset, limit),
  },
  Presentation: {
    wallet: ({ walletId }, _, { dataLoaders: { wallets } }) => (walletId ? wallets.load(walletId) : null),
  },
  Wallet: {
    firstUsed: (wallet, _, { dataLoaders: { walletFirstUsed } }) => walletFirstUsed.load(wallet.id),
    lastUsed: (wallet, _, { dataLoaders: { walletLastUsed } }) => walletLastUsed.load(wallet.id),
  },
}
