import type { ClientMetadata } from 'oidc-provider'
import { runDeduplicatedJob } from '../../background-jobs'
import { apiUrl, portalUrl } from '../../config'
import { dataSource, ISOLATION_LEVEL as TXN_ISOLATION_LEVEL } from '../../data'
import { OidcApplicationType } from '../../generated/graphql'
import { logger } from '../../logger'
import { OidcScopes } from '../../roles'
import { addUserToManager } from '../auditing/user-context-helper'
import { IssuanceEntity } from '../issuance/entities/issuance-entity'
import { PartnerEntity } from '../partners/entities/partner-entity'
import { createSystemUser, SYSTEM_USER_OID, UserEntity } from '../users/entities/user-entity'
import { mappedClaims, resourceScopes, staticDemoClaimMappings, type ClaimMapping } from './claims'
import { OidcClientEntity } from './entities/oidc-client-entity'
import { OidcClientResourceEntity } from './entities/oidc-client-resource-entity'
import { OidcResourceEntity } from './entities/oidc-resource-entity'
import { portalClientPolicyUrl, portalClientTermsOfServiceUrl } from './portal-client-data'
import { oidcProviderModule } from './provider'

export const portalClientId = '7cb4a314-2322-48bf-a764-b57e50766468'
export const apiResourceId = 'f0d8ede0-18d2-4af3-b38a-4a6ad13c6eee'

export type OidcData = {
  clients: OidcClientEntity[]
  clientMetadata: ClientMetadata[]
  resources: OidcResourceEntity[]
  resourceScopes: Record<string, string[]>
  partners: PartnerEntity[]
  claimMappings: ClaimMapping[]
  mappedClaims?: Record<string, string[]>
}

export async function loadOidcData(): Promise<OidcData> {
  const [clients, resources, partners] = await loadOrInitialise()
  return {
    clients,
    clientMetadata: clients.map(toOidcClientMetadata),
    resources,
    resourceScopes: resourceScopes(resources),
    partners,
    claimMappings: staticDemoClaimMappings,
    mappedClaims: mappedClaims(staticDemoClaimMappings),
  }
}

const toOidcClientMetadata = ({
  id,
  name,
  redirectUris,
  postLogoutUris,
  termsOfServiceUrl,
  policyUrl,
  applicationType,
}: OidcClientEntity): ClientMetadata => ({
  client_id: id,
  client_name: name,
  redirect_uris: redirectUris,
  post_logout_redirect_uris: postLogoutUris,
  response_types: ['code', 'code id_token', 'id_token'],
  grant_types: ['authorization_code', 'refresh_token', 'implicit'],
  token_endpoint_auth_method: 'none',
  tos_uri: termsOfServiceUrl ?? undefined,
  policy_uri: policyUrl ?? undefined,
  application_type: applicationType ?? undefined,
})

type SourceOidcData = [OidcClientEntity[], OidcResourceEntity[], PartnerEntity[]]

async function loadOrInitialise(): Promise<SourceOidcData> {
  const data = await loadExistingData()
  if (dataIsInitialised(data)) return data
  await runDeduplicatedJob({ name: 'initialiseOidcData', payload: undefined }, true)
  const initialised = await loadExistingData()
  if (!dataIsInitialised(initialised)) throw new Error('Failed to initialise OIDC data')
  return initialised
}

export function loadExistingData(): Promise<SourceOidcData> {
  return dataSource.manager.transaction(TXN_ISOLATION_LEVEL, async (entityManager) => {
    const clientRepo = entityManager.getRepository(OidcClientEntity)
    const resourceRepo = entityManager.getRepository(OidcResourceEntity)
    const partnerRepo = entityManager.getRepository(PartnerEntity)
    const clients = await clientRepo.find({ relations: { resources: true, partners: true } })
    const resources = await resourceRepo.find()
    const partners = await partnerRepo.find()
    return [clients, resources, partners]
  })
}

const portalRedirectUri = new URL(portalUrl).toString()
const portalDemoRedirectUri = `${portalUrl}/demo/authn`

function portalClientUrisAreCorrect(client: OidcClientEntity) {
  if (client.redirectUris[0] !== portalRedirectUri) {
    logger.warn(`Portal client redirect URI[0] is incorrect, expected ${portalRedirectUri}, got ${client.redirectUris[0]}`)
    return false
  }
  if (client.postLogoutUris[0] !== portalRedirectUri) {
    logger.warn(`Portal client postLogout URI[0] is incorrect, expected ${portalRedirectUri}, got ${client.postLogoutUris[0]}`)
    return false
  }
  if (client.redirectUris[1] !== portalDemoRedirectUri) {
    logger.warn(`Portal client redirect URI[1] is incorrect, expected ${portalDemoRedirectUri}, got ${client.redirectUris[1]}`)
    return false
  }
  if (client.postLogoutUris[1] !== portalDemoRedirectUri) {
    logger.warn(`Portal client postLogout URI[1] is incorrect, expected ${portalDemoRedirectUri}, got ${client.postLogoutUris[1]}`)
    return false
  }
  return true
}

function apiResourceHasCorrectScope(resource: OidcResourceEntity) {
  if (resource.resourceIndicator !== apiUrl) {
    logger.warn(`API resource scope is incorrect, expected ${apiUrl}, got ${resource.resourceIndicator}`)
    return false
  }
  return true
}

function dataIsInitialised([clients, resources]: SourceOidcData) {
  const portalClient = clients.find((c) => c.id === portalClientId)
  if (!portalClient) {
    logger.warn(`Portal client is missing`)
    return false
  }
  const apiResource = resources.find((r) => r.id === apiResourceId)
  if (!apiResource) {
    logger.warn(`API resource is missing`)
    return false
  }
  if (!portalClientUrisAreCorrect(portalClient)) return false
  if (!apiResourceHasCorrectScope(apiResource)) return false
  logger.info('OIDC data is initialised ✅')
  return true
}

export async function initialiseDataFromDeduplicatedBackgroundJob() {
  logger.info('Initialising OIDC data')

  await dataSource.manager.transaction(TXN_ISOLATION_LEVEL, async (entityManager) => {
    const userRepo = entityManager.getRepository(UserEntity)
    const clientRepo = entityManager.getRepository(OidcClientEntity)
    const resourceRepo = entityManager.getRepository(OidcResourceEntity)
    const clientResourceRepo = entityManager.getRepository(OidcClientResourceEntity)

    // this is the first time we need to run audited operations as the system with no user context
    const systemUser = (await userRepo.findOneBy({ oid: SYSTEM_USER_OID })) ?? (await userRepo.save(createSystemUser()))
    addUserToManager(entityManager, systemUser.id)

    const portalClient = await clientRepo.findOneBy({ id: portalClientId })
    const apiResource = await resourceRepo.findOneBy({ id: apiResourceId })

    // update URLs if they have changed
    let updatedConfig = false
    if (portalClient && !portalClientUrisAreCorrect(portalClient)) {
      portalClient.redirectUris = [portalRedirectUri, portalDemoRedirectUri]
      portalClient.postLogoutUris = [portalRedirectUri, portalDemoRedirectUri]
      await clientRepo.save(portalClient)
      updatedConfig = true
    }
    if (apiResource && !apiResourceHasCorrectScope(apiResource)) {
      apiResource.resourceIndicator = apiUrl
      await resourceRepo.save(apiResource)
      updatedConfig = true
    }

    const dataExists = !!portalClient && !!apiResource
    if (dataExists) {
      if (!updatedConfig) logger.warn('OIDC data is already initialised, no work was done')
      return
    }

    // create api resource
    if (!apiResource)
      await resourceRepo.save(
        new OidcResourceEntity({
          id: apiResourceId,
          name: 'Verified Orchestration API',
          resourceIndicator: apiUrl,
          scopes: [OidcScopes.issuee],
        }),
      )
    // create portal client
    if (!portalClient) {
      await clientRepo.save(
        new OidcClientEntity({
          id: portalClientId,
          name: 'Verified Orchestration Concierge',
          applicationType: OidcApplicationType.Web,
          redirectUris: [portalRedirectUri, portalDemoRedirectUri],
          postLogoutUris: [portalRedirectUri, portalDemoRedirectUri],
          allowAnyPartner: true,
          policyUrl: portalClientPolicyUrl,
          termsOfServiceUrl: portalClientTermsOfServiceUrl,
        }),
      )
      // give portal client access to api resource)
      await clientResourceRepo.save(
        new OidcClientResourceEntity({
          clientId: portalClientId,
          resourceId: apiResourceId,
          resourceScopes: [OidcScopes.issuee],
        }),
      )
    }
  })
}

export async function checkIssuanceIsNotRevoked(issuanceId: string) {
  const isRevoked = await dataSource.manager.transaction(TXN_ISOLATION_LEVEL, async (entityManager) => {
    return await entityManager.getRepository(IssuanceEntity).existsBy({ id: issuanceId, isRevoked: true })
  })
  if (isRevoked) {
    const { errors } = await oidcProviderModule()
    throw new errors.AccessDenied('Credential has been revoked')
  }
}
