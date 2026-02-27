import { asyncIssuanceContactLoader, asyncIssuanceLoader } from './features/async-issuance/loaders'
import { presentationFlowLoader, presentationFlowTemplateLoader } from './features/presentation-flow/loaders'
import { contractLoader } from './features/contracts/loaders'
import { identityStoreLoader } from './features/identity-store/loaders'
import { identityLoader, isIdentityDeletableLoader } from './features/identity/loaders'
import { applicationLabelConfigLoader, corsOriginConfigLoader } from './features/instance-configs/loaders'
import { issuanceCountByContractLoader, issuanceCountByIdentityLoader, issuanceLoader } from './features/issuance/loaders'
import { oidcClaimMappingsLoader, oidcClientLoader, oidcResourceLoader } from './features/oidc-provider/loaders'
import { partnerByDidLoader, partnerLoader, presentationPartnersLoader } from './features/partners/loaders'
import { presentationLoader } from './features/presentation/loaders'
import { templateLoader } from './features/templates/loaders'
import { userLoader } from './features/users/loaders'
import { walletLoader, walletUsedDateLoader } from './features/wallet/loaders'
import type { Services } from './services'

export type DataLoaders = ReturnType<typeof createDataLoaders>

export const createDataLoaders = (services: Services) => ({
  users: userLoader(),
  identities: identityLoader(),
  identityStores: identityStoreLoader(),
  contracts: contractLoader(),
  templates: templateLoader(),
  issuances: issuanceLoader(),
  issuanceCountByIdentity: issuanceCountByIdentityLoader(),
  issuanceCountByContract: issuanceCountByContractLoader(),
  partners: partnerLoader(),
  partnersByDid: partnerByDidLoader(),
  presentationPartnersLoader: presentationPartnersLoader(),
  presentations: presentationLoader(),
  presentationFlows: presentationFlowLoader(),
  presentationFlowTemplates: presentationFlowTemplateLoader(),
  asyncIssuances: asyncIssuanceLoader(),
  asyncIssuanceContact: asyncIssuanceContactLoader(services.asyncIssuances),
  oidcClients: oidcClientLoader(),
  oidcResources: oidcResourceLoader(),
  oidcClaimMappings: oidcClaimMappingsLoader(),
  isIdentityDeletable: isIdentityDeletableLoader(),
  wallets: walletLoader(),
  walletFirstUsed: walletUsedDateLoader('MIN'),
  walletLastUsed: walletUsedDateLoader('MAX'),
  applicationLabelConfigs: applicationLabelConfigLoader(),
  corsOriginConfigs: corsOriginConfigLoader(),
})
