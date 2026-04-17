import type { ClientMetadata, ResponseType } from 'oidc-provider'
import { oidcSecretService } from '.'
import { runDeduplicatedJob } from '../../background-jobs'
import { apiUrl, portalUrl } from '../../config'
import { transactionOrReuse } from '../../data'
import { addUserToManager } from '../../data/user-context-helper'
import { OidcApplicationType, OidcClientType, OidcResponseType, OidcTokenEndpointAuthMethod } from '../../generated/graphql'
import { logger } from '../../logger'
import { OidcScopes } from '../../roles'
import { IssuanceEntity } from '../issuance/entities/issuance-entity'
import { PartnerEntity } from '../partners/entities/partner-entity'
import { SYSTEM_USER_ID } from '../users/entities/user-entity'
import { mappedClaims as mapClaims, resourceScopes as mapRsourceScopes } from './claims'
import type { OidcClaimMappingEntity } from './entities/oidc-claim-mapping-entity'
import { OidcClientEntity } from './entities/oidc-client-entity'
import { OidcClientResourceEntity } from './entities/oidc-client-resource-entity'
import { OidcResourceEntity } from './entities/oidc-resource-entity'
import { portalClientPolicyUrl, portalClientTermsOfServiceUrl } from './portal-client-data'
import { oidcProviderModule } from './provider'

export const portalClientName = 'VO Concierge'
export const portalClientId = '7cb4a314-2322-48bf-a764-b57e50766468'
export const apiResourceId = 'f0d8ede0-18d2-4af3-b38a-4a6ad13c6eee'

export type OidcData = {
  clients: OidcClientEntity[]
  clientMetadata: ClientMetadata[]
  resources: OidcResourceEntity[]
  resourceScopes: Record<string, string[]>
  partners: PartnerEntity[]
  mappedClaims?: Record<string, string[]>
}

export async function loadOidcData(): Promise<OidcData> {
  const [clients, resources, partners] = await loadOrInitialise()
  const claimMappings: OidcClaimMappingEntity[] = []

  for (const client of clients) {
    for (const mapping of await client.claimMappings) {
      if (!claimMappings.some((m) => m.id === mapping.id)) claimMappings.push(mapping)
    }
  }

  const clientMetadata = await Promise.all(clients.map(toOidcClientMetadata))
  const resourceScopes = mapRsourceScopes(resources)
  const mappedClaims = mapClaims(claimMappings)

  return {
    clients,
    clientMetadata,
    resources,
    resourceScopes,
    partners,
    mappedClaims,
  }
}

const toOidcClientMetadata = async ({
  id,
  name,
  redirectUris,
  postLogoutUris,
  termsOfServiceUrl,
  policyUrl,
  applicationType,
  clientType,
  authorizationRequestsTypeJarEnabled,
  relyingPartyJwks,
  relyingPartyJwksUri,
  tokenEndpointAuthMethod,
  clientJwks,
  clientJwksUri,
  responseTypes,
}: OidcClientEntity): Promise<ClientMetadata> => {
  // Resolve auth method: use stored value, or fall back to legacy logic for backward compat
  const authMethod =
    tokenEndpointAuthMethod ??
    (clientType === OidcClientType.Confidential ? OidcTokenEndpointAuthMethod.ClientSecretPost : OidcTokenEndpointAuthMethod.None)

  let clientSecret: string | undefined

  if (authMethod === OidcTokenEndpointAuthMethod.ClientSecretPost) {
    try {
      clientSecret = await oidcSecretService().get(id)
    } catch (error) {
      throw new Error(`Failed to retrieve secret for client ID=${id}`, { cause: error })
    }
  } else {
    clientSecret = undefined
  }

  // Determine JWKS/JWKS URI for client metadata
  // node-oidc-provider uses a single jwks/jwks_uri field for both private_key_jwt auth and JAR verification.
  // We merge keys from both sources: auth keys (clientJwks/clientJwksUri) and JAR keys (relyingPartyJwks/relyingPartyJwksUri).
  // Only one jwks_uri can be set — if both auth and JAR use URIs, one must be provided as inline JWKS instead.
  const jwksKeys: object[] = []
  let jwksUri: string | undefined

  // Auth keys (private_key_jwt)
  if (authMethod === OidcTokenEndpointAuthMethod.PrivateKeyJwt) {
    if (clientJwks) {
      const parsed = clientJwks as { keys?: object[] } | { kty: string }
      const keys: object[] = 'keys' in parsed && parsed.keys ? parsed.keys : [parsed]
      jwksKeys.push(...keys)
    }
    if (clientJwksUri) {
      jwksUri = clientJwksUri
    }
  }

  // JAR keys (request object verification)
  if (authorizationRequestsTypeJarEnabled) {
    if (relyingPartyJwks) {
      const parsed = relyingPartyJwks as { keys?: object[] } | { kty: string }
      const keys: object[] = 'keys' in parsed && parsed.keys ? parsed.keys : [parsed]
      jwksKeys.push(...keys)
    }
    if (relyingPartyJwksUri && !jwksUri) {
      jwksUri = relyingPartyJwksUri
    }
  }

  const jwks = jwksKeys.length > 0 ? { keys: jwksKeys } : undefined
  const oidcProviderResponseType = toOidcProviderResponseTypes(responseTypes)
  const oidcProviderGrantTypes = toOidcProviderGrantTypes(responseTypes)

  return {
    client_id: id,
    client_name: name,
    client_secret: clientSecret,
    redirect_uris: redirectUris,
    post_logout_redirect_uris: postLogoutUris,
    grant_types: oidcProviderGrantTypes,
    response_types: oidcProviderResponseType,
    token_endpoint_auth_method: authMethod,
    tos_uri: termsOfServiceUrl ?? undefined,
    policy_uri: policyUrl ?? undefined,
    application_type: applicationType,
    ...(jwks ? { jwks } : {}),
    ...(jwksUri ? { jwks_uri: jwksUri } : {}),
  }
}

export const toOidcProviderResponseTypes = (responseTypes: OidcResponseType[]): ResponseType[] => {
  const hasCode = responseTypes.includes(OidcResponseType.Code)
  const hasIdToken = responseTypes.includes(OidcResponseType.IdToken)

  if (!hasCode && hasIdToken) {
    return ['id_token']
  }

  if (hasCode && hasIdToken) {
    return ['code', 'id_token', 'code id_token']
  }

  // Authorization Code flow (default)
  return ['code']
}

// Map schema response types from entity to OIDC provider's grant values
const toOidcProviderGrantTypes = (responseTypes: OidcResponseType[]): string[] => [
  'authorization_code',
  'refresh_token',
  ...(responseTypes.includes(OidcResponseType.IdToken) ? ['implicit'] : []),
]

type SourceOidcData = [OidcClientEntity[], OidcResourceEntity[], PartnerEntity[]]

async function loadOrInitialise(): Promise<SourceOidcData> {
  const data = await loadExistingData()
  if (dataIsInitialised(data)) return data
  await runDeduplicatedJob('initialiseOidcData', {}, true)
  const initialised = await loadExistingData()
  if (!dataIsInitialised(initialised)) throw new Error('Failed to initialise OIDC data')
  return initialised
}

export function loadExistingData(): Promise<SourceOidcData> {
  return transactionOrReuse(async (entityManager) => {
    const clientRepo = entityManager.getRepository(OidcClientEntity)
    const resourceRepo = entityManager.getRepository(OidcResourceEntity)
    const partnerRepo = entityManager.getRepository(PartnerEntity)
    const clients = await clientRepo.find({ relations: { resources: true, partners: true, claimMappings: true } })
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

  await transactionOrReuse(async (entityManager) => {
    const clientRepo = entityManager.getRepository(OidcClientEntity)
    const resourceRepo = entityManager.getRepository(OidcResourceEntity)
    const clientResourceRepo = entityManager.getRepository(OidcClientResourceEntity)

    addUserToManager(entityManager, SYSTEM_USER_ID)

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
    // backfill tokenEndpointAuthMethod for legacy portal clients that were created without it
    if (portalClient && portalClient.tokenEndpointAuthMethod === null) {
      portalClient.tokenEndpointAuthMethod = OidcTokenEndpointAuthMethod.None
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
          name: 'VO API',
          resourceIndicator: apiUrl,
          scopes: [OidcScopes.issuee],
        }),
      )
    // create portal client
    if (!portalClient) {
      await clientRepo.save(
        new OidcClientEntity({
          id: portalClientId,
          name: portalClientName,
          applicationType: OidcApplicationType.Web,
          clientType: OidcClientType.Public,
          tokenEndpointAuthMethod: OidcTokenEndpointAuthMethod.None,
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
  const isRevoked = await transactionOrReuse(async (entityManager) => {
    return await entityManager.getRepository(IssuanceEntity).existsBy({ id: issuanceId, isRevoked: true })
  })
  if (isRevoked) {
    const { errors } = await oidcProviderModule()
    throw new errors.AccessDenied('Credential has been revoked')
  }
}
