import type { ClientMetadata } from 'oidc-provider'
import { portalUrl } from '../../config'
import type { PresentationRequestForAuthnInput, PresentationRequestInput } from '../../generated/graphql'

export const clients: ClientMetadata[] = [
  {
    client_id: '7cb4a314-2322-48bf-a764-b57e50766468',
    application_type: 'web',
    redirect_uris: [`${portalUrl}/demo/authn`],
    post_logout_redirect_uris: [`${portalUrl}/demo/authn`],
    response_types: ['code', 'code id_token', 'id_token'],
    grant_types: ['authorization_code', 'refresh_token', 'implicit'],
    token_endpoint_auth_method: 'none',
  },
]

export async function findClient(clientId: string) {
  return clients.find((c) => c.client_id === clientId)
}

export async function buildAuthnPresentationRequest({
  request,
}: {
  clientId: string
  request?: PresentationRequestForAuthnInput
}): Promise<PresentationRequestInput> {
  // TODO: implement from client, validate input, etc
  return {
    includeQRCode: true,
    registration: {
      clientName: 'Verified Orchestration Portal',
    },
    requestedCredentials: [
      {
        configuration: request?.requestedCredentials?.[0]?.configuration,
        type: request?.requestedCredentials?.[0]?.type ?? 'VerifiableCredential',
        acceptedIssuers: request?.requestedCredentials?.[0]?.acceptedIssuers ?? undefined,
      },
    ],
  }
}
