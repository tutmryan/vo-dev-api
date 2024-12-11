import 'oidc-provider'
import type { errors, interactionPolicy as origInteractionPolicy, OIDCProviderError } from 'oidc-provider'

declare module 'oidc-provider' {
  export interface ClientMetadata {}

  // These are missing from the DefinitelyTyped file for oidc-provider.
  class InvalidAuthorizationDetails extends OIDCProviderError {
    constructor(description?: string, detail?: string)
  }
  class UseDpopNonce extends OIDCProviderError {
    constructor(description?: string, detail?: string)
  }

  // The definitely typed file for oidc-provider exports interactionPolicy as a namespace, but it's actually an object.
  // Adds missing static properties to the Check class.
  export type interactionPolicy = {
    Check: typeof origInteractionPolicy.Check
    Prompt: typeof origInteractionPolicy.Prompt
    base: () => origInteractionPolicy.DefaultPolicy
  }

  // The definitely typed file for oidc-provider exports errors as a namespace, but that makes it difficult to import all the errors at once.
  // This is a workaround to export all the errors as a single object, which is closer to how the errors are exported in the oidc-provider codebase.
  export type Errors = {
    // The base error class that extends the built-in Error class.
    OIDCProviderError: typeof errors.OIDCProviderError

    AccessDenied: typeof errors.AccessDenied
    AuthorizationPending: typeof errors.AuthorizationPending
    ConsentRequired: typeof errors.ConsentRequired
    CustomOIDCProviderError: typeof errors.CustomOIDCProviderError
    ExpiredLoginHintToken: typeof errors.ExpiredLoginHintToken
    ExpiredToken: typeof errors.ExpiredToken
    InsufficientScope: typeof errors.InsufficientScope
    InteractionRequired: typeof errors.InteractionRequired
    InvalidAuthorizationDetails: typeof InvalidAuthorizationDetails
    InvalidBindingMessage: typeof errors.InvalidBindingMessage
    InvalidClient: typeof errors.InvalidClient
    InvalidClientAuth: typeof errors.InvalidClientAuth
    InvalidClientMetadata: typeof errors.InvalidClientMetadata
    InvalidDpopProof: typeof errors.InvalidDpopProof
    InvalidGrant: typeof errors.InvalidGrant
    InvalidRedirectUri: typeof errors.InvalidRedirectUri
    InvalidRequest: typeof errors.InvalidRequest
    InvalidRequestObject: typeof errors.InvalidRequestObject
    InvalidRequestUri: typeof errors.InvalidRequestUri
    InvalidScope: typeof errors.InvalidScope
    InvalidSoftwareStatement: typeof errors.InvalidSoftwareStatement
    InvalidTarget: typeof errors.InvalidTarget
    InvalidToken: typeof errors.InvalidToken
    InvalidUserCode: typeof errors.InvalidUserCode
    LoginRequired: typeof errors.LoginRequired
    MissingUserCode: typeof errors.MissingUserCode
    RegistrationNotSupported: typeof errors.RegistrationNotSupported
    RequestNotSupported: typeof errors.RequestNotSupported
    RequestUriNotSupported: typeof errors.RequestUriNotSupported
    SessionNotFound: typeof errors.SessionNotFound
    SlowDown: typeof errors.SlowDown
    TemporarilyUnavailable: typeof errors.TemporarilyUnavailable
    TransactionFailed: typeof errors.TransactionFailed
    UnapprovedSoftwareStatement: typeof errors.UnapprovedSoftwareStatement
    UnauthorizedClient: typeof errors.UnauthorizedClient
    UnknownUserId: typeof errors.UnknownUserId
    UnmetAuthenticationRequirements: typeof errors.UnmetAuthenticationRequirements
    UnsupportedGrantType: typeof errors.UnsupportedGrantType
    UnsupportedResponseMode: typeof errors.UnsupportedResponseMode
    UnsupportedResponseType: typeof errors.UnsupportedResponseType
    UseDpopNonce: typeof UseDpopNonce
  }
}
