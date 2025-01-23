import { approvalRequestLoader } from './features/approval-request/loaders'
import { asyncIssuanceContactLoader, asyncIssuanceLoader } from './features/async-issuance/loaders'
import { contractLoader } from './features/contracts/loaders'
import { identityLoader } from './features/identity/loaders'
import { issuanceCountByContractLoader, issuanceCountByIdentityLoader, issuanceLoader } from './features/issuance/loaders'
import { oidcClientLoader, oidcResourceLoader } from './features/oidc-provider/loaders'
import { partnerLoader } from './features/partners/loaders'
import { presentationLoader } from './features/presentation/loaders'
import { templateLoader } from './features/templates/loaders'
import { userLoader } from './features/users/loaders'
import type { Services } from './services'

export type DataLoaders = ReturnType<typeof createDataLoaders>

export const createDataLoaders = (services: Services) => ({
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
  asyncIssuances: asyncIssuanceLoader(),
  asyncIssuanceContact: asyncIssuanceContactLoader(services.asyncIssuances),
  oidcClients: oidcClientLoader(),
  oidcResources: oidcResourceLoader(),
})
