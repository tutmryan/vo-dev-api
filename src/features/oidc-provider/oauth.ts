// Error Response
// Ref: https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.2.1
export const oauthErrors = {
  invalidRequest: 'invalid_request',
  unauthorizedClient: 'unauthorized_client',
  accessDenied: 'access_denied',
  unsupportedResponseType: 'unsupported_response_type',
  invalidScope: 'invalid_scope',
  serverError: 'server_error',
  temporarilyUnavailable: 'temporarily_unavailable',
}
