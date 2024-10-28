import 'oidc-provider'

declare module 'oidc-provider' {
  export interface ClientMetadata {
    // TODO: define custom client props in OIDC provider extraClientMetadata with validator
    unique_claim_for_subject_identifier?: string
  }
}
