import { approvalRequestLoader } from './features/approval-request/loaders'
import { contractLoader } from './features/contracts/loaders'
import { identityLoader } from './features/identity/loaders'
import { issuanceCountByContractLoader, issuanceCountByIdentityLoader, issuanceLoader } from './features/issuance/loaders'
import { partnerLoader } from './features/partners/loaders'
import { presentationLoader } from './features/presentation/loaders'
import { templateLoader } from './features/templates/loaders'
import { userLoader } from './features/users/loaders'

export type DataLoaders = ReturnType<typeof createDataLoaders>

export const createDataLoaders = () => ({
  users: userLoader(),
  identities: identityLoader(),
  contracts: contractLoader(),
  templates: templateLoader(),
  issuances: issuanceLoader(),
  issuanceCountByIdentity: issuanceCountByIdentityLoader(),
  issuanceCountByContract: issuanceCountByContractLoader(),
  partners: partnerLoader(),
  presentations: presentationLoader(),
  approvalRequests: approvalRequestLoader(),
})
