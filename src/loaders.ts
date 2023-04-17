import { contractLoader } from './features/contracts/loaders'
import { identityLoader } from './features/identity/loaders'
import { userLoader } from './features/users/loaders'

export type DataLoaders = ReturnType<typeof createDataLoaders>

export const createDataLoaders = () => ({
  users: userLoader(),
  identities: identityLoader(),
  contracts: contractLoader(),
})
