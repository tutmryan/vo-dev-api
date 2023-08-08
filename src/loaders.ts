import { contractLoader } from './features/contracts/loaders'
import { identityLoader } from './features/identity/loaders'
import { issuanceLoader } from './features/issuance/loaders'
import { templateLoader } from './features/templates/loaders'
import { userLoader } from './features/users/loaders'

export type DataLoaders = ReturnType<typeof createDataLoaders>

export const createDataLoaders = () => ({
  users: userLoader(),
  identities: identityLoader(),
  contracts: contractLoader(),
  templates: templateLoader(),
  issuances: issuanceLoader(),
})
